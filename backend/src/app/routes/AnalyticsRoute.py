from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date


from ..db import get_db, User
from ..security import get_current_user # using your teammate's security!
from ..RandomForestClassifier import calculate_weight_adjustment, exercise_recommendation
from profile import get_fitness_profile, get_or_create_user_profile

router = APIRouter(prefix="/analytics", tags=["Analytics & Prediction"])

#random forest model -> fast API route. accept metrics to return live model predictions  
@router.post("/predict")
async def predict_workout(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    #call random forest model
    current_user_id = current_user.user_id

    today_day = date.today()
    today_day_name = today_day.strftime('%A').lower()

    #pull from user fitness profile to get next day
    #pull avaliable exercises 

    #weight adjustment if needed
    user_weight = await calculate_weight_adjustment(User, Depends())

    
    fitness_profile_data = await get_fitness_profile(User, Depends())
    
    prediction = []
    #next exercise 
    next_exercises = await exercise_recommendation(User, Depends())
    prediction.append(next_exercises)

    return prediction  