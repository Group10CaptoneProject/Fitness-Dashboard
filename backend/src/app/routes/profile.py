import uuid
import pandas as pd 
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db import get_db, User, UserFitnessProfile, UserProfile, GoalEnum, GenderEnum, MuscleCategoryEnum, MuscleGroupEnum, ExperienceLevelEnum, EquipmentEnum, DayOfWeekEnum
from ..schema import UserProfileCreate, UserProfileResponse, UserFitnessProfileCreate, UserFitnessProfileResponse
from ..analytics import main
from ..security import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

#fitness profile table 
@router.post("/fitness-profile")
async def create_fitness_profile(profile_data: UserFitnessProfileCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    #convert data to SQL object
    current_user_id = current_user.user_id
    fitness_profile = UserFitnessProfile(user_id = current_user_id, **profile_data.model_dump())

    db.add(fitness_profile)
    await db.commit()
    await db.refresh(fitness_profile)
    return fitness_profile

#default fitness profile
@router.get("/fitness-profile", response_model=UserProfileResponse)
async def get_fitness_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    #check if exist
    current_user_id = current_user.user_id

    stmt = select(UserFitnessProfile).where(UserFitnessProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    fitness_profile = result.scalar_one_or_none()

    #create default profile
    if not fitness_profile:
        fitness_profile = UserFitnessProfile(
            user_id = current_user_id,
            gender = "male",
            age = 22,
            height = 170,
            weight = 140,
            preferd_workout_days = ["Monday", "Tuesday", "Thursday", "Friday"],
            weekly_split = {"Monday": "Back, Triceps, Shoulders", "Tuesday": "Chest, Biceps, Glutes", "Thursday": "Back, Triceps, Shoulders", "Friday": "Chest, Biceps, Glutes"}
        )

    db.add(fitness_profile)
    await db.commit()
    await db.refresh(fitness_profile)

    return fitness_profile 

#update fitness profile 
@router.put("/fitness-profile", response_model=UserFitnessProfileResponse)
async def update_fitess_profile(fitness_profile, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    
    current_user_id = current_user.user_id
    stmt = select(UserFitnessProfile).where(UserFitnessProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    db_fitness_profile = result.scalar_one_or_none()

    if not fitness_profile:
        raise HTTPException(status_code=404, detail="Fitness Profile not found")

    #update the fitness data
    fitness_profile_dict = fitness_profile.model_dump(exclude_unset=True)
    for key, value in fitness_profile_dict.items():
        setattr(db_fitness_profile, key, value)

    await db.commit()
    await db.refresh(db_fitness_profile)
    return db_fitness_profile
    
#use prpofile table
@router.post("/user-profile")
async def create_user_profile(profile_data: UserProfileCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user_id = current_user.user_id
    
    user_profile_data = profile_data.model_dump()
    user_profile_data.pop("preferred_workout_days", None)

    user_profile = UserProfile(user_id = current_user_id, **user_profile_data)

    db.add(user_profile)
    await db.commit()
    await db.refresh(user_profile)

    return user_profile

#default values for user profile 
@router.get("/user-profile", response_model=UserProfileResponse)
async def get_or_create_user_profile(current_user: User  =Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Check if profile already exists
    current_user_id = current_user.user_id
    stmt = select(UserProfile).where(UserProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    # If it doesn't exist, create it with default values
    if not profile:
        profile = UserProfile(
            user_id=current_user_id,
            primary_goal="healthy_lifestyle",
            experience_level="beginner",
            equipment_available=["dumbbells", "bodyweight"]
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile

#allow user to edit default
@router.put("/user-profile", response_model=UserProfileResponse)
async def update_user_profile(profile_data: UserProfileCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user_id = current_user.user_id
    stmt = select(UserProfile).where(UserProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Update fields with incoming data
    profile_dict = profile_data.model_dump(exclude_unset=True)
    for key, value in profile_dict.items():
        setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)
    return profile

