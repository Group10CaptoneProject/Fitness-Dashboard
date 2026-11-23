from fastapi import Depends, APIRouter, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, String

from sqlalchemy.orm import selectinload 
from ..schema import TargetPlanCreate, TargetPlanResponse
from ..security import get_current_user
from ..db import TargetPlan, get_db, User 
from ..RandomForestClassifier import get_exercise_stats

router = APIRouter(prefix="/target-plan")

@router.post("/exercise-target-plan")
async def create_exercise_target_plan(
    plan_data: TargetPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    exercise_data = get_exercise_stats()

    matches = exercise_data[exercise_data["exercise_name"].str.strip().str.lower()  == plan_data.exercise_name.strip().lower()]

    if matches.empty:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found"
        )

    exercise_id = matches.iloc[0]["exercise_id"]

    #find exercise if for the user 
    current_user_id = current_user.user_id

    #get the entry
    stmt = select(TargetPlan).where(TargetPlan.user_id == current_user_id, TargetPlan.exercise_id == exercise_id)  

    result = await db.execute(stmt)
    target_plan_entry = result.scalar_one_or_none()

    #does plan exist:

    if target_plan_entry:
        #if it's there, update the target plan
        target_plan_entry.weights_goal = plan_data.weights_goal
        target_plan_entry.reps_goal = plan_data.reps_goal
        target_plan_entry.sets_goal = plan_data.sets_goal
        target_plan_entry.rest_time_goal = plan_data.rest_time_goal
    else:
        target_plan_entry = TargetPlan(
            user_id=current_user_id,
            exercise_id=exercise_id,
            weights_goal= plan_data.weights_goal,
            reps_goal= plan_data.reps_goal,
            sets_goal= plan_data.sets_goal,
            rest_time_goal= plan_data.rest_time_goal
        )
        db.add(target_plan_entry)

    await db.commit()
    await db.refresh(target_plan_entry)
    return TargetPlanResponse(
        exercise_name = matches.iloc[0]["exercise_name"],
        sets_goal = target_plan_entry.sets_goal,
        reps_goal = target_plan_entry.reps_goal,
        weights_goal = target_plan_entry.weights_goal,
        rest_time_goal = target_plan_entry.rest_time_goal
    )

#get endpoint for target plan
@router.get("/exercise-target-plan", response_model=list[TargetPlanResponse])
async def get_exercise_target_plan(current_user: User = Depends(get_current_user), target_plan_response = TargetPlanResponse , db:AsyncSession = Depends(get_db)):
    current_user_id = current_user.user_id 

    #get target plan response 
    result = await db.execute(select(TargetPlan).where(TargetPlan.user_id == current_user_id))
    target_plan_entries = result.scalars().all()

    exercise_data = get_exercise_stats()
    target_plan_responses = []

    #get the target plan 
    for plan in target_plan_entries:
        matches = exercise_data[exercise_data["exercise_id"] == plan.exercise_id]
        if matches.empty:
            exercise_name = "Unknown Exercise"
        else:
            exercise_name = matches.iloc[0]["exercise_name"]

        target_plan_responses.append({
            "exercise_name": exercise_name, 
            "sets_goal": plan.sets_goal,
            "reps_goal": plan.reps_goal,
            "weights_goal": plan.weights_goal,
            "rest_time_goal": plan.rest_time_goal
        })

    return target_plan_responses
