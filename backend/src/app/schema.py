from pydantic import BaseModel, Field, model_validator
import uuid 
from typing import List 
from datetime import date, datetime
from enum import Enum as PyEnum

from .db import GoalEnum, ExperienceLevelEnum, EquipmentEnum, DayOfWeekEnum, MuscleCategoryEnum, MuscleGroupEnum
from sqlalchemy import String, Integer, ARRAY, Enum
from sqlalchemy.orm import Mapped, mapped_column

#new entry requirements
class DailyEntryCreate(BaseModel):
    used_id = uuid.UUID()
    entry_date: date
    sleep: int = Field(..., ge=0, le=24)
    energy_level: int = Field(..., ge=1, le=10)
    soreness: int = Field(..., ge=1, le=10)
    stress: int = Field(..., ge=1, le=10)
    heart_rate: int = Field(..., ge=30, le=220)
    difficulty: int = Field(..., ge=1, le=10)

    # Mandatory exercise fields
    muscle_category: MuscleCategoryEnum
    muscle_group: MuscleGroupEnum
    exercise_name: str = Field(..., min_length=1, max_length=100)

    @model_validator(mode="after")
    def validate_muscle_group_category(self):
        category_map = {
            MuscleCategoryEnum.UPPER_BODY: {
                MuscleGroupEnum.CHEST, 
                MuscleGroupEnum.BACK, 
                MuscleGroupEnum.BICEPS,
                MuscleGroupEnum.TRICEPS, MuscleGroupEnum.SHOULDERS
            },
            MuscleCategoryEnum.LOWER_BODY: {
                MuscleGroupEnum.QUADS, 
                MuscleGroupEnum.HAMSTRINGS,
                MuscleGroupEnum.GLUTES, 
                MuscleGroupEnum.CALVES
            },
            MuscleCategoryEnum.CARDIO_CORE: {
                MuscleGroupEnum.ABS
            }
        }

        allowed_groups = category_map.get(self.muscle_category, set())
        if self.muscle_group not in allowed_groups:
            raise ValueError(
                f"Muscle group '{self.muscle_group.value}' is invalid for category '{self.muscle_category.value}'"
            )
        return self

#entry esponse 
class DailyEntryResponse(BaseModel):
    entry_id: int
    user_id: uuid.UUID
    created_at: datetime 

    class Config:
        from_attribute = True 

#profile created
class UserProfileCreate(BaseModel):
    primary_goal: GoalEnum
    experience_level: ExperienceLevelEnum
    
    equipment_available: List[EquipmentEnum] = Field(..., min_length=1)
    preferred_workout_days: List[DayOfWeekEnum] = Field(..., min_length=1)

#profile response 
class UserProfileResponse(UserProfileCreate):
    user_id: uuid.UUID

    class Config:
        from_attributes = True 


def main():
   pass  
        