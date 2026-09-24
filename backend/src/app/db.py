import asyncio
import uuid
from datetime import datetime, date 
from collections.abc import AsyncGenerator
from sqlalchemy import String, Integer, ForeignKey, Numeric, Date, DateTime, UniqueConstraint, func, text
from decimal import Decimal

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, AsyncSession, async_sessionmaker
from app.config.config import settings

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

async def get_db(): 
    async with async_session_maker() as session: 
        yield session

#set up SQL base 
class Base(DeclarativeBase):
    pass 

#create the user profile class
class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )
    primary_goal: Mapped[str] = mapped_column(String(100), nullable=False)

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

    profile: Mapped["UserProfile"] = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

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

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())  

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
    
    __table_args__ = (
        UniqueConstraint("user_id", name="unique_user_target_plan"),
    )

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