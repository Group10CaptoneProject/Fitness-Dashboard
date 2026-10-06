import uuid
import pandas as pd 
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db import get_db, UserFitnessProfile, UserProfile
from ..schema import UserProfileCreate, UserProfileResponse, UserFitnessProfileCreate, UserFitnessProfileResponse

router = APIRouter(prefix="/profile", tags=["fitness-profile", "user-profile"])

#fitness profile table 
@router.post("/fitness-profile")
async def create_fitness_profile(profile_data: UserFitnessProfileCreate, current_user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    #convert data to SQL object
    fitness_profile = UserFitnessProfile(user_id = current_user_id, **profile_data.model_dump())

    db.add(fitness_profile)
    await db.commit()
    await db.refresh(fitness_profile)
    return fitness_profile

#use prpofile table
@router.post("/user-profile")
async def create_user_profile(profile_data: UserProfileCreate, current_user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user_profile = UserProfile(user_id = current_user_id, **profile_data.model_dump())

    db.add(user_profile)
    await db.commit()
    await db.refresh(user_profile)

    return user_profile


