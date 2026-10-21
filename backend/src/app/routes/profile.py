import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import (
    get_db,
    User,
    UserFitnessProfile,
    UserProfile,
)
from ..schema import (
    UserProfileCreate,
    UserProfileResponse,
    UserFitnessProfileCreate,
    UserFitnessProfileResponse,
)
from ..security import get_current_user

router = APIRouter(
    prefix="/profile",
    tags=["profile"],
)


#default fitness profile
@router.get("/fitness-profile", response_model=UserFitnessProfileResponse)
async def get_fitness_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    #check if exist
    current_user_id = current_user.user_id

    stmt = select(UserFitnessProfile).where(UserFitnessProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    fitness_profile = result.scalar_one_or_none()

    if not fitness_profile:
        fitness_profile = UserFitnessProfile(
            user_id=current_user_id,
            gender="male",
            age=22,
            height=170,
            weight=140,
            preferd_workout_days=["Monday", "Tuesday", "Thursday", "Friday"],
            weekly_split={"Monday": "Back, Triceps, Shoulders", "Tuesday": "Chest, Biceps, Glutes"}
        )

        db.add(fitness_profile)
        try:
            await db.commit()
            await db.refresh(fitness_profile)
        except:
            await db.rollback()
            raise HTTPException(status_code=500, detail="Could not create default fitness profile.")

    return fitness_profile 

#update fitness profile 
@router.patch("/fitness-profile", response_model=UserFitnessProfileResponse)
async def update_fitess_profile(fitness_profile: UserFitnessProfileCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user_id = current_user.user_id
    stmt = select(UserFitnessProfile).where(UserFitnessProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    db_fitness_profile = result.scalar_one_or_none()

    #create the fitness profile if it does not exist
    fitness_profile_dict = fitness_profile.model_dump(exclude_unset=True)
    if not db_fitness_profile:
        db_fitness_profile = UserFitnessProfile(
            user_id=current_user_id,
            **fitness_profile_dict,
        )
        db.add(db_fitness_profile)
    else:
        #update the fitness data
        for key, value in fitness_profile_dict.items():
            setattr(db_fitness_profile, key, value)

    try:
        await db.commit()
        await db.refresh(db_fitness_profile)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Could not save fitness profile.")

    return db_fitness_profile

#use prpofile table
@router.patch("/user-profile", response_model=UserProfileResponse)
async def patch_user_profile(profile_data: UserProfileCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user_id = current_user.user_id

    stmt = select(UserProfile).where(UserProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    user_profile = result.scalar_one_or_none()

    profile_data_dict = profile_data.model_dump()

    #handle JSON array data
    if "equipment_available" in profile_data_dict and profile_data_dict["equipment_available"]:
        #get equipment 
        profile_data_dict["equipment_available"] = [item.value if hasattr(item, "value") else item for item in profile_data_dict["equipment_available"]]

    if "preferred_workout_days" in profile_data_dict and profile_data_dict["preferred_workout_days"]:
        profile_data_dict["preferred_workout_days"] = [day.value if hasattr(day, "value") else day for day in profile_data_dict["preferred_workout_days"]]

    #create the user profile if it does not exist
    if not user_profile:
        user_profile = UserProfile(
            user_id=current_user_id,
            **profile_data_dict,
        )
        db.add(user_profile)
    else:
        #update the existing user profile
        for field, value in profile_data_dict.items():
            setattr(user_profile, field, value)

    try:
        await db.commit()
        await db.refresh(user_profile)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Could not save user profile.")

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
        try:
            await db.commit()
            await db.refresh(profile)

        except Exception:
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save fitness information.")

    return profile