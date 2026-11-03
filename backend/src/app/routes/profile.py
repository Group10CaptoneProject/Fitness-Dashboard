import logging
import uuid
import inspect

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
    UserProfilePatch,
    UserProfileResponse,
    UserFitnessProfileCreate,
    UserFitnessProfilePatch,
    UserFitnessProfileResponse,
)
from ..security import get_current_user

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.exc import IntegrityError
from .. import security

logger = logging.getLogger(__name__)

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
            preferred_workout_days=[],
            weekly_split={"Monday": "Back, Triceps, Shoulders", "Tuesday": "Chest, Biceps, Glutes"}
        )

        db.add(fitness_profile)
        try:
            await db.commit()
            await db.refresh(fitness_profile)
        except Exception:
            await db.rollback()
            raise HTTPException(status_code=500, detail="Could not create default fitness profile.")

    return fitness_profile 

#update fitness profile 
@router.patch("/fitness-profile", response_model=UserFitnessProfileResponse)
async def update_fitess_profile(fitness_profile: UserFitnessProfilePatch, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user_id = current_user.user_id
    stmt = select(UserFitnessProfile).where(UserFitnessProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    db_fitness_profile = result.scalar_one_or_none()

    #create the fitness profile if it does not exist
    fitness_profile_dict = fitness_profile.model_dump(exclude_unset=True, exclude_none=True)
    if not db_fitness_profile:
        # Supply defaults when creating a profile from a partial PATCH request.
        profile_defaults = {
            "gender": "prefer_not_to_say",
            "age": 22,
            "height": 170,
            "weight": 140,
            "preferred_workout_days": [],
            "weekly_split": {},
        }
        profile_defaults.update(fitness_profile_dict)

        db_fitness_profile = UserFitnessProfile(
            user_id=current_user_id,
            **profile_defaults,
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
        logger.exception("Could not save fitness profile for user %s", current_user_id)
        raise HTTPException(status_code=500, detail="Could not save fitness profile.")

    return db_fitness_profile

#use prpofile table.
@router.patch("/user-profile", response_model=UserProfileResponse)
async def patch_user_profile(profile_data: UserProfilePatch, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user_id = current_user.user_id

    stmt = select(UserProfile).where(UserProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    user_profile = result.scalar_one_or_none()

    # Only update the fields included in this PATCH request.
    profile_data_dict = profile_data.model_dump(exclude_unset=True, exclude_none=True)

    #handle JSON array data
    if "equipment_available" in profile_data_dict and profile_data_dict["equipment_available"]:
        #get equipment 
        profile_data_dict["equipment_available"] = [item.value if hasattr(item, "value") else item for item in profile_data_dict["equipment_available"]]

    if "preferred_workout_days" in profile_data_dict and profile_data_dict["preferred_workout_days"]:
        profile_data_dict["preferred_workout_days"] = [day.value if hasattr(day, "value") else day for day in profile_data_dict["preferred_workout_days"]]

    #create the user profile if it does not exist
    if not user_profile:
        # Supply defaults when creating a profile from a partial PATCH request.
        profile_defaults = {
            "primary_goal": "healthy_lifestyle",
            "experience_level": "beginner",
            "equipment_available": ["dumbbells", "bodyweight"],
            "preferred_workout_days": ["monday"],
            "session_duration": 60,
            "is_onboarded": False,
        }
        profile_defaults.update(profile_data_dict)

        user_profile = UserProfile(
            user_id=current_user_id,
            **profile_defaults,
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
            equipment_available=["dumbbells", "bodyweight"],
            preferred_workout_days=["monday"],
            session_duration=60,
            is_onboarded=False,
        )
        db.add(profile)
        try:
            await db.commit()
            await db.refresh(profile)

        except Exception:
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save fitness information.")

    return profile

#account information (username, email, member since)
class AccountResponse(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


#only the username can be edited
class AccountPatch(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Username must be at least 3 characters.")
        if any(character.isspace() for character in value):
            raise ValueError("Username cannot contain spaces.")
        return value


#change password request (max 72 because bcrypt ignores anything longer)
class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=72)
    new_password: str = Field(..., min_length=8, max_length=72)


#use the password helpers from security.py. If yours have different names, add them here.
async def _call_password_helper(names, *args):
    for name in names:
        helper = getattr(security, name, None)
        if helper:
            result = helper(*args)
            if inspect.isawaitable(result):
                result = await result
            return result

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Password helpers were not found in security.py.",
    )


async def _verify_password(plain_password: str, hashed_password: str) -> bool:
    return await _call_password_helper(("verify_password",), plain_password, hashed_password)


async def _hash_password(password: str) -> str:
    return await _call_password_helper(("hash_password", "get_password_hash"), password)


#get the logged in user's account information
@router.get("/account", response_model=AccountResponse)
async def get_account(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.user_id == current_user.user_id))
    user = result.scalar_one()

    return user


#update the username
@router.patch("/account", response_model=AccountResponse)
async def update_account(account_data: AccountPatch, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.user_id == current_user.user_id))
    user = result.scalar_one()

    if account_data.username != user.username:
        #usernames must be unique
        taken_result = await db.execute(
            select(User.user_id).where(
                User.username == account_data.username,
                User.user_id != user.user_id,
            )
        )
        if taken_result.scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is already taken.")

        user.username = account_data.username

        try:
            await db.commit()
            await db.refresh(user)
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is already taken.")
        except Exception:
            await db.rollback()
            logger.exception("Could not update username for user %s", user.user_id)
            raise HTTPException(status_code=500, detail="Could not update username.")

    return user


#change the password (the current password must be correct)
@router.post("/change-password")
async def change_password(password_data: PasswordChange, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.user_id == current_user.user_id))
    user = result.scalar_one()

    #400 instead of 401/403 so the page does not report an expired session
    if not await _verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")

    if password_data.new_password == password_data.current_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different from your current password.")

    user.password_hash = await _hash_password(password_data.new_password)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        logger.exception("Could not update password for user %s", user.user_id)
        raise HTTPException(status_code=500, detail="Could not update password.")

    return {"message": "Password updated."}