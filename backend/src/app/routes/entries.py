import uuid
import pandas as pd
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from ..db import get_db, DailyEntry, DailyScore, User
from ..schema import DailyEntryCreate
from ..analytics import calculate_readiness_data, update_user_dashboard  # or your scoring function
from ..security import get_current_user
router = APIRouter(prefix="/entries", tags=["Daily Entries"])

#new daily entry
@router.post("/")
async def create_daily_entry(entry_data: DailyEntryCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)): 
    #convert to data to SQL table object
    current_user_id = current_user.user_id
    #always use the logged in user's id, never the one sent by the client
    entry_values = {**entry_data.model_dump(), "user_id": current_user_id}

    #check if this user already calculated this date
    existing_result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.user_id == current_user_id,
            DailyEntry.entry_date == entry_data.entry_date,
        )
    )
    new_entry = existing_result.scalar_one_or_none()

    if new_entry:
        #date already has an entry: override it with the new input
        for key, value in entry_values.items():
            setattr(new_entry, key, value)
    else:
        new_entry = DailyEntry(**entry_values)
        #save object. add entry
        db.add(new_entry)

    day_name = new_entry.entry_date.strftime('%A').lower()

    await db.commit()
    await db.refresh(new_entry)

    #query past 7 days for analytics (ending on the date being calculated)
    result = await db.execute(
        select(DailyEntry)
        .where(DailyEntry.user_id == current_user_id, DailyEntry.entry_date <= new_entry.entry_date)
        .order_by(DailyEntry.entry_date.desc())
        .limit(7)
    )
    #user entry data
    user_entries = result.scalars().all()

    #convert SQL table entry object -> df
    entries_table = [
        {
            "entry_date": entry.entry_date,
            "sleep": entry.sleep,
            "energy_level": entry.energy_level,
            "soreness": entry.soreness,
            "stress": entry.stress,
            "heart_rate": entry.heart_rate,
            "duration": entry.duration,
            "difficulty": entry.difficulty,
            "sets": entry.sets,
            "reps": entry.reps,
            "weight": entry.weight,

            "muscle_category": entry.muscle_category.value if hasattr(entry.muscle_category, "value") else entry.muscle_category,
            "muscle_group": entry.muscle_group.value if hasattr(entry.muscle_group, "value") else entry.muscle_group,
            "exercise_name": entry.exercise_name,
        }
        for entry in user_entries
    ]

    #calculate readiness data
    entry_df = pd.DataFrame(entries_table) 

    #pass df to analytics
    readiness_results = await calculate_readiness_data(entry_df)   
    
    #recalculating a date, remove its old score so the new one replaces it
    await db.execute(
        delete(DailyScore).where(
            DailyScore.user_id == current_user_id,
            DailyScore.score_date == new_entry.entry_date,
        )
    )
    await db.commit()

    #daily score calulcation
    await update_user_dashboard(user_id=current_user_id, score_date = new_entry.entry_date, dashboard = readiness_results)

    #return response 
    return {
        "message": "Daily entry saved",
        "entry": new_entry,
        "readiness": readiness_results.to_dict(orient="records")    #convert df -> dict
    }

#get the saved entry for one date (used to refill the daily entry page)
@router.get("/")
async def get_daily_entry(entry_date: date, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.user_id == current_user.user_id,
            DailyEntry.entry_date == entry_date,
        )
    )
    entry = result.scalar_one_or_none()

    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No entry for this date")

    return {
        "entry_id": entry.entry_id,
        "user_id": str(entry.user_id),
        "entry_date": entry.entry_date.isoformat(),
        "sleep": entry.sleep,
        "energy_level": entry.energy_level,
        "soreness": entry.soreness,
        "stress": entry.stress,
        "heart_rate": entry.heart_rate,
        "duration": entry.duration,
        "difficulty": entry.difficulty,
        "muscle_category": entry.muscle_category.value if hasattr(entry.muscle_category, "value") else entry.muscle_category,
        "muscle_group": entry.muscle_group.value if hasattr(entry.muscle_group, "value") else entry.muscle_group,
        "exercise_name": entry.exercise_name,
    }