import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db, DailyEntry
from app.analytics import calculate_readiness_data  # Pandas math function

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

#get the entry data from entry path
@router.get("/{user_id}")
async def get_daily_entry_data(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    #get faily entry from entires file
    daily_entry_result = await db.execute(
        select(DailyEntry)
        .where(DailyEntry.user_id == user_id)
        .order_by(DailyEntry.entry_date.desc())
        .limit(14)
    )
    #add it
    entries = daily_entry_result.scalars().all
    if not entries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No entries found for this user."
        )

    readiness_summary = calculate_readiness_data(entries)
