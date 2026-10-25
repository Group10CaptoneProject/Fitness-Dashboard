import uuid
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..db import get_db, User, DailyEntry, UserProfile, UserFitnessProfile
from ..analytics import calculate_readiness_data, get_daily_score  # Pandas math function
from ..schema import DailyScoreResponse
from ..security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

#get the entry data from entry path
@router.get("/")
async def get_daily_entry_data(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    
    #profile
    user_id = current_user.user_id
    user_profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    user_profile = user_profile_result.scalars().first()
    
    #fitness profile
    fitness_profile_result = await db.execute(select(UserFitnessProfile).where(UserFitnessProfile.user_id == user_id))
    fitness_profile = fitness_profile_result.scalars().all()

    #get faily entry from entires file
    daily_entry_result = await db.execute(
        select(DailyEntry)
        .where(DailyEntry.user_id == user_id)
        .order_by(DailyEntry.entry_date.desc())
        .limit(7)
    )
    entries = daily_entry_result.scalars().all()

    if not entries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No entries found for this user."
        )

    entries_table = [
        {
            "entry_date": entry.entry_date,
            "sleep": entry.sleep,
            "energy_level": entry.energy_level,
            "soreness": entry.soreness,
            "stress": entry.stress,
            "heart_rate": entry.heart_rate,
            "difficulty": entry.difficulty,
            "duration": entry.duration,
            "muscle_category": entry.muscle_category.value if hasattr(entry.muscle_category, "value") else entry.muscle_category,
            "muscle_group": entry.muscle_group.value if hasattr(entry.muscle_group, "value") else entry.muscle_group,
            "exercise_name": entry.exercise_name,
        }
        for entry in entries 
    ]

    entry_df = pd.DataFrame(entries_table)
    readiness_summary = await calculate_readiness_data(entry_df)
    return {
       "user_id": user_id,
       "user_profile": user_profile,
       "fitness_profile": fitness_profile,
       "entries": entries_table,
       "readiness_summary": readiness_summary.to_dict(orient="records") if isinstance(readiness_summary, pd.DataFrame) else readiness_summary 
    }

@router.get("/scores", response_model=List[DailyScoreResponse])
async def read_user_daily_scores(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    #fetch df
    user_id = current_user.user_id
    scores_df = await get_daily_score(user_id)

    #edge case
    if scores_df.empty:
        return []

    #convert df -> dict 
    return scores_df.to_dict(orient="records")  
