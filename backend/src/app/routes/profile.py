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


# ----------------------------------------
# Create or update the user's fitness data
# ----------------------------------------

@router.post(
    "/fitness-profile",
    response_model=UserFitnessProfileResponse,
)
async def create_fitness_profile(
    profile_data: UserFitnessProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserFitnessProfile).where(
            UserFitnessProfile.user_id == current_user.user_id
        )
    )

    fitness_profile = result.scalar_one_or_none()

    if fitness_profile is None:
        fitness_profile = UserFitnessProfile(
            user_id=current_user.user_id,
            **profile_data.model_dump(),
        )
        db.add(fitness_profile)
    else:
        for field, value in profile_data.model_dump().items():
            setattr(fitness_profile, field, value)

    try:
        await db.commit()
        await db.refresh(fitness_profile)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save fitness information.",
        )

    return fitness_profile


# ----------------------------------------
# Create or update workout preferences
# ----------------------------------------

@router.post(
    "/user-profile",
    response_model=UserProfileResponse,
)
async def create_user_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserProfile).where(
            UserProfile.user_id == current_user.user_id
        )
    )

    user_profile = result.scalar_one_or_none()

    # Convert enum values into strings for the PostgreSQL array fields.
    profile_data_dict = profile_data.model_dump()

    profile_data_dict["equipment_available"] = [
        item.value for item in profile_data.equipment_available
    ]

    profile_data_dict["preferred_workout_days"] = [
        day.value for day in profile_data.preferred_workout_days
    ]

    if user_profile is None:
        user_profile = UserProfile(
            user_id=current_user.user_id,
            **profile_data_dict,
        )
        db.add(user_profile)
    else:
        for field, value in profile_data_dict.items():
            setattr(user_profile, field, value)

    try:
        await db.commit()
        await db.refresh(user_profile)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save workout preferences.",
        )

    return user_profile