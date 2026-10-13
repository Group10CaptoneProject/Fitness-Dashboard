from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db, User
from ..security import get_current_user # using your teammate's security!
from ..RandomForestClassifier import calculate_weight_adjustment, exercise_recommendation

router = APIRouter(prefix="/analytics", tags=["Analytics & Prediction"])

#random forest model -> fast API route. accept metrics to return live model predictions  
@router.post("/predict")
async def predict_workout(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    #call random forest model
    current_user_id = current_user.user_id

    #weight adjustment if needed
    user_weight = await calculate_weight_adjustment(current_user_id, db: AsyncSession = Depends(get_db))

    #next exercise 
    next_exercises = await exercise_recommendation(current_user_id, db: AsyncSession = Depends(get_db))

    #get entries + their date (date, muscle groups)
    #find current day of the week
    #find next day of the week 

    #make sure next prediction doesn't overlap with the previous entry's info 


    return prediction 