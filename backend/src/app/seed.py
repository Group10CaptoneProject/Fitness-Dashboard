from datetime import datetime, timedelta, date
import random
from sqlalchemy.orm import Session
from db import async_session_maker, engine, User, UserProfile, DailyEntry, DailyScore, TargetPlan, UserDashboard

async def seed_database():
    async with async_session_maker() as session:
        new_user = User(
           username="test_athlete",
            email="test@gmail.com",
            first_name="test",
            last_name="test",
            password="$argon2id$v=19$m=65536,t=3,p=4$hor0Jf6A4EkahzK+IG288w$JlUkjQT+aQ/n/9Dg9oCBDtSE7NMYKNvKPVPJE7AXM7M",
            daily_scores=100 
        )
        new_user.profile = UserProfile(primary_goal="strength")

        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)

        #generate data
        start_date = date.today() - timedelta(days=45)
        entries = []

        for i in range(45):
            current_date = start_date + timedelta(days = i)

            #sleep
            sleep_hours = random.choice([6, 6, 7, 7, 8, 8, 9])
            energy = random.randint(4, 9)
            soreness = random.randint(2, 9)
            stress = random.randint(2, 7)
            workout_heart_rate = random.randint(100, 180)
            duration = 90
            difficulty = random.randint(6, 9)

            entry = DailyEntry(
                user_id=new_user.user_id,
                entry_date=current_date,
                sleep= sleep_hours,
                energy_level=energy,
                soreness=soreness,
                stress=stress,
                heart_rate= workout_heart_rate,
                duration=90,
                difficulty=random.randint(3, 9)
            )
            entries.append(entry) 
        
        session.add_all(entries)
        await session.commit()
        print(f"Successfully seeded 45 chronological entries for user: {new_user.username}")

        

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_database())    

