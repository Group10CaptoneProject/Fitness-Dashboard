from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date


from ..db import get_db, User
from ..security import get_current_user # using your teammate's security!
from ..RandomForestClassifier import calculate_weight_adjustment, exercise_recommendation
from .profile import get_fitness_profile, get_or_create_user_profile

router = APIRouter(prefix="/analytics", tags=["Analytics & Prediction"])

#random forest model -> fast API route. accept metrics to return live model predictions  
@router.post("/predict")
async def predict_workout(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user_id = current_user.user_id

    #find recommended weight for 1 exercise
    recommended_weight = calculate_weight_adjustment(current_user, db)

    #exercise list
    recommendation_list = await exercise_recommendation(current_user, db)

    #find next day
    exercise_list = recommendation_list.get("recommendations", []) 
    target_day = recommendation_list.get("day", "")

    prediction_record = {}
    for exercise in exercise_list:
        name = exercise.get("name")
        prediction_record[name] = {
            "tagret_muscle": name["targeted_muscle"],
            "equipment": name["required_equipment"],
            "recommended_weight": recommended_weight,
            "gif_url": name["gif_url"]
        }

    return {
        "day": target_day,
        "workout_plan": prediction_record
    }