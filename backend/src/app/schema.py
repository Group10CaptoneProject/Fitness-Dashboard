from pydantic import BaseModel, Field, model_validator
import uuid 
from typing import List 
from datetime import date
from enum import Enum as PyEnum

from .db import GoalEnum, ExperienceLevelEnum, EquipmentEnum, DayOfWeekEnum, MuscleCategoryEnum, MuscleGroupEnum
from sqlalchemy import String, Integer, ARRAY, Enum
from sqlalchemy.orm import Mapped, mapped_column

class DailyEntryCreate(BaseModel):
    entry_date: date
    sleep: int = Field(..., ge=0, le=24)
    energy_level: int = Field(..., ge=1, le=10)
    soreness: int = Field(..., ge=1, le=10)
    stress: int = Field(..., ge=1, le=10)
    heart_rate: int = Field(..., ge=30, le=220)
    duration: int = Field(..., ge=0)
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

class UserProfileCreate(BaseModel):
    primary_goal: GoalEnum
    experience_level: ExperienceLevelEnum
    preferred_duration: int = Field(..., ge=15, le=180, description="Preferred duration in minutes")
    
    equipment_available: List[EquipmentEnum] = Field(..., min_length=1)
    preferred_workout_days: List[DayOfWeekEnum] = Field(..., min_length=1)

class UserProfileResponse(UserProfileCreate):
    user_id: uuid.UUID

    class Config:
        from_attributes = True 
        