import uuid
import pandas as pd
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db import get_db, DailyEntry, User
from ..schema import DailyEntryCreate
from ..analytics import calculate_readiness_data, update_user_dashboard  # or your scoring function

router = APIRouter(prefix="/entries", tags=["Daily Entries"])

#new daily entry
@router.post("/")
async def create_daily_entry(entry_data: DailyEntryCreate, current_user_id: uuid.UUID, db: AsyncSession = Depends(get_db)): 
    #convert to data to SQL table object
    new_entry = DailyEntry(user_id = current_user_id, **entry_data.model_dump())

    #save object. add entry
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)

    #query past 7 days for analytics
    result = await db.execute(
        select(DailyEntry)
        .where(DailyEntry.user_id == current_user_id)
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
    
    #daily score calulcation
    await update_user_dashboard(user_id=current_user_id, score_date = new_entry.entry_date, dashboard = readiness_results)

    #return response 
    return {
        "message": "Daily entry saved",
        "entry": new_entry,
        "readiness": readiness_results.to_dict(orient="records")    #convert df -> dict
    }
