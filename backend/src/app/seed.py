import asyncio
from datetime import datetime, timedelta, date
import random
from passlib.context import CryptContext
from sqlalchemy import select
import uuid 
from sqlalchemy.orm import Session
from app.db import (
    Base, 
    AsyncSessionLocal,
    async_session_maker,
    engine,
    User,
    UserProfile,
    UserFitnessProfile,
    DailyEntry,
    DailyScore,
    TargetPlan,
    GenderEnum,
    GoalEnum,
    ExperienceLevelEnum,
    MuscleCategoryEnum,
    MuscleGroupEnum,
)
from app.analytics import (
    get_entries_by_id,
    calculate_readiness_data,
    update_user_dashboard,
)
#password hash
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

async def seed_database():
    #recreate tables in Neon 
    async with engine.begin() as conn:
        print("Dropping and recreating database tables...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database schema successfully synchronized!")

    async with AsyncSessionLocal() as session:
        raw_password = "fitness 2026"
        hashed_password = pwd_context.hash(raw_password)

        async with async_session_maker() as session:
            # Check if user already exists
            stmt = select(User).where(User.username == "alex_warren")
            existing_user = (await session.execute(stmt)).scalar_one_or_none()

            # If user exists, delete them so CASCADE cleans up old records
            if existing_user:
                await session.delete(existing_user)
                await session.commit()
                print("Removed existing 'alex_warren' user and associated historical records.")
            
            new_user = User(
                username="alex_warren",
                email="alex.warren2@gmail.com",
                first_name="Alex",
                last_name="Warren",
                password_hash= hashed_password
            )

            new_user.profile = UserProfile(
                primary_goal=GoalEnum.HYPERTROPY,
                experience_level=ExperienceLevelEnum.INTERMEDIATE,
                equipment_available=["barbell", "dumbbell", "cables"],
            )

            new_user.fitness_profile = UserFitnessProfile(
                gender=GenderEnum.MALE,
                age=22,
                height=170,
                weight=125,
            )
            
            #target plan
            new_user.target_plan = TargetPlan(
                sets_goal=16,           # 16 total sets
                reps_goal=4,           # 10 reps per set
                weights_goal=185.50,    # 185.5 lbs
                rest_time_goal=90       # 90 seconds rest
            )

            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)

            #generate data
            start_date = date.today() - timedelta(days=45)
            entries = []

            for i in range(45):
                current_date = start_date + timedelta(days = i)
                entry = DailyEntry(
                    user_id=new_user.user_id,
                    entry_date=current_date,
                    sleep=random.choice([6, 7, 7, 8, 8, 9]),
                    energy_level=random.randint(4, 9),
                    soreness=random.randint(2, 8),
                    stress=random.randint(2, 7),
                    heart_rate=random.randint(110, 175),
                    duration = 90,
                    difficulty=random.randint(4, 9),

                    muscle_category=MuscleCategoryEnum.UPPER_BODY,
                    muscle_group= MuscleGroupEnum.CHEST,
                    exercise_name = "Inclined Bench Press",
                )
                entries.append(entry) 
            
            session.add_all(entries)
            await session.commit()
            print(f"Successfully seeded 45 chronological entries for user: {new_user.username}")

            raw_df = await get_entries_by_id(new_user.user_id)
            processed_df = await calculate_readiness_data(raw_df)

            #add entry into the readiness (user dashboard update)
            for current_date in processed_df["entry_date"]:
                await update_user_dashboard(new_user.user_id, current_date, processed_df)
            
            print("Seed complete! All tables populated in Neon.")

if __name__ == "__main__":
    asyncio.run(seed_database())    

