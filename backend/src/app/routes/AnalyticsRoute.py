from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from sqlalchemy import select

from ..db import get_db, User, UserFitnessProfile
from ..security import get_current_user # using your teammate's security!
from ..RandomForestClassifier import calculate_weight_adjustment, exercise_recommendation
from .profile import get_fitness_profile, get_or_create_user_profile

router = APIRouter(prefix="/analytics", tags=["Analytics & Prediction"])

#random forest model -> fast API route. accept metrics to return live model predictions  
@router.post("/predict")
async def predict_workout(muscle_groups, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), target_date: Optional[date] = None):
    #exercise list
    recommendation_list = await exercise_recommendation(muscle_groups = muscle_groups, current_user = current_user, db = db)

    #find next day
    exercise_list = recommendation_list.get("recommendations", []) 
    target_day = recommendation_list.get("day", "")

    prediction_record = {}
    for exercise in exercise_list:
        name = exercise["name"]
        prediction_record[name] = {
            "muscle_group": exercise.get("muscle_group"),
            "target_muscle": exercise.get("target_muscle"),
            "equipment": exercise.get("equipment"),
            "recommended_weight": await calculate_weight_adjustment(name, current_user, db),
            "gif_url": exercise.get("gif_url")
        }

    return {
        "day": target_day,
        "date": target_date, 
        "workout_plan": prediction_record
    }

@router.post("/predict/weekWorkout")
async def generate_weekly_workout(current_user: User  = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    #get current user and fitness profile
    current_user_id = current_user.user_id
    result = await db.execute(
        select(UserFitnessProfile).where(UserFitnessProfile.user_id == current_user_id
        )
    )
    current_fitness_profile = result.scalar_one_or_none()

    #check
    if current_fitness_profile is None:
        raise HTTPException(
            status_code=404,
            detail="Fitness profile not found"
        )

    workout_days = current_fitness_profile.preferred_workout_days
    user_split = current_fitness_profile.weekly_split

    weekly_workout_routine = []
    today = date.today()
    day_numbers = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6
    }
    for index, day in enumerate(workout_days):
        muscle_groups = user_split.get(day.lower(), [])

        days_ahead = (day_numbers[day.lower()] - today.weekday())
        target_date = today + timedelta(days = days_ahead)

        current_workout = await predict_workout(muscle_groups = muscle_groups, current_user = current_user, db = db, target_date= target_date)
        weekly_workout_routine.append(current_workout)              

    return weekly_workout_routine    