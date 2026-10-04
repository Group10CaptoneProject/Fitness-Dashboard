import asyncio
import uuid
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from datetime import datetime, date 
from enum import Enum as PyEnum
from collections.abc import AsyncGenerator
from sqlalchemy import String, Integer, ForeignKey, Numeric, Date, DateTime, UniqueConstraint, func, text, Enum
from decimal import Decimal

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, AsyncSession, async_sessionmaker
from app.config.config import settings
# import SessionLocal 

database_url = make_url(settings.database_url)
database_url = database_url.set(drivername="postgresql+asyncpg")
database_url = database_url.difference_update_query(
    ["sslmode", "channel_binding"]
)

engine = create_async_engine(
    database_url,
    connect_args={"ssl": "require"},
)

async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]: 
    async with async_session_maker() as session: 
        yield session

class GoalEnum(str, PyEnum):
    HYPERTROPY = "hypertropy"
    ENDURANCE = "endurance"
    HEALTHY_LIFESTYLE = "healthy_lifestyle"

class GenderEnum(str, PyEnum):
    MALE = "male"
    FEMALE = "female"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class MuscleCategoryEnum(str, PyEnum):
    UPPER_BODY = "upper_body"
    LOWER_BODY = "lower_body"
    CARDIO_CORE = "cardio_core"

class MuscleGroupEnum(str, PyEnum):
    # Upper Body
    CHEST = "chest"
    BACK = "back"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    SHOULDERS = "shoulders"
    
    # Lower Body
    QUADS = "quads"
    HAMSTRINGS = "hamstrings"
    GLUTES = "glutes"
    CALVES = "calves"
    
    # Cardio/Core
    ABS = "abs"

#set up SQL base 
class Base(DeclarativeBase):
    pass 

#create the user profile class
class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    primary_goal: Mapped[GoalEnum] = mapped_column(Enum(GoalEnum, native_enum=False), nullable=False, default=GoalEnum.HEALTHY_LIFESTYLE)
    user: Mapped["User"] = relationship("User", back_populates="profile")

#user login info
class User(Base):
    __tablename__ = "users"
     
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) 
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    #map user's data to the user profile 
    profile: Mapped["UserProfile"] = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    target_plan: Mapped["TargetPlan"] = relationship("TargetPlan", back_populates="user", uselist=False, cascade="all, delete-orphan")
    daily_entries: Mapped[list["DailyEntry"]] = relationship("DailyEntry", back_populates="user", cascade="all, delete-orphan")
    daily_scores: Mapped[list["DailyScore"]] = relationship("DailyScore", back_populates="user", cascade="all, delete-orphan")

    #onbaording page 1
    fitness_profile: Mapped["UserFitnessProfile"] = relationship("UserFitnessProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class DailyEntry(Base):
    __tablename__ = "daily_entries"

    entry_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)

    sleep: Mapped[int] = mapped_column(Integer)
    energy_level: Mapped[int] = mapped_column(Integer)
    soreness: Mapped[int] = mapped_column(Integer) 
    stress: Mapped[int] = mapped_column(Integer) 
    heart_rate: Mapped[int] = mapped_column(Integer)
    duration: Mapped[int] = mapped_column(Integer)

    difficulty: Mapped[int] = mapped_column(Integer)

    # Workout / Exercise Fields
   # Mandatory Exercise Fields
    muscle_category: Mapped[MuscleCategoryEnum] = mapped_column(
        Enum(MuscleCategoryEnum, native_enum=False), nullable=False
    )
    muscle_group: Mapped[MuscleGroupEnum] = mapped_column(
        Enum(MuscleGroupEnum, native_enum=False), nullable=False
    )
    exercise_name: Mapped[str] = mapped_column(String(100), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())  

    user: Mapped["User"] = relationship("User", back_populates="daily_entries")
    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="unique_user_daily_entry"),
    )

#score table (output)
class DailyScore(Base):
    __tablename__ = "daily_scores"

    score_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    score_date: Mapped[date] = mapped_column(Date, nullable=False)

    recovery: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    fatigue: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    workload_balance_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    final_training_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)  

    readiness_level: Mapped[str] = mapped_column(String(50), nullable=False)
    workout_adjustment: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    #map the daily score data to the user
    user: Mapped["User"] = relationship("User", back_populates="daily_scores")

    __table_args__ = (
        UniqueConstraint("user_id", "score_date", name="unique_score_date"),
    )   

class TargetPlan(Base):
    __tablename__ = "target_plans"

    plan_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    duration_goal: Mapped[int] = mapped_column(Integer, nullable=True)
    sets_goal: Mapped[int] = mapped_column(Integer, nullable=True)
    reps_goal: Mapped[int] = mapped_column(Integer, nullable=True)
    weights_goal: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=True)
    rest_time_goal: Mapped[int] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    #map target plan to user
    user: Mapped["User"] = relationship("User", back_populates="target_plan")
    __table_args__ = (
        UniqueConstraint("user_id", name="unique_user_target_plan"),
    )

#For forgot/reset password 
class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    reset_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )

    code_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    used: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

#user fitness data
class UserFitnessProfile(Base):
    __tablename__ = "fitness_profile"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    gender: Mapped[GenderEnum] = mapped_column(Enum(GenderEnum, native_enum=False), nullable=False, default=GenderEnum.PREFER_NOT_TO_SAY)    
    
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    weight: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user: Mapped["User"] = relationship("User", back_populates="fitness_profile")

#initialize sql tables 
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized successfully.")

# For testing the database connection
async def test_connection():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("Database connection successful")
    except Exception as e:
        print("Database connection failed:", e)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_connection())
    asyncio.run(init_db())
