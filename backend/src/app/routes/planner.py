from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..RandomForestClassifier import fetch_and_cache_exercises, get_exercise_stats
from ..db import DayOfWeekEnum, PlannedExercise, User, get_db
from ..security import get_current_user

router = APIRouter(prefix="/planner", tags=["Workout Planner"])


class PlannedExerciseCreate(BaseModel):
    day: DayOfWeekEnum
    exercise_id: str = Field(min_length=1, max_length=100)


@router.get("/workouts")
async def get_workouts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PlannedExercise.day, PlannedExercise.exercise_id, PlannedExercise.exercise_name)
        .where(PlannedExercise.user_id == current_user.user_id)
        .order_by(PlannedExercise.exercise_name, PlannedExercise.exercise_id)
    )
    return [dict(row) for row in result.mappings()]


@router.post("/workouts")
async def save_workout(
    workout: PlannedExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await fetch_and_cache_exercises()
    exercises = get_exercise_stats()
    names = exercises.loc[
        exercises["exercise_id"] == workout.exercise_id, "exercise_name"
    ].dropna()
    if names.empty:
        raise HTTPException(status_code=404, detail="Exercise not found")

    saved = {
        "day": workout.day.value,
        "exercise_id": workout.exercise_id,
        "exercise_name": names.iloc[0],
    }
    statement = insert(PlannedExercise).values(user_id=current_user.user_id, **saved)
    await db.execute(
        statement.on_conflict_do_update(
            index_elements=[PlannedExercise.user_id, PlannedExercise.day, PlannedExercise.exercise_id],
            set_={"exercise_name": statement.excluded.exercise_name},
        )
    )
    await db.commit()
    return saved


@router.delete("/workouts", status_code=204)
async def remove_workout(
    day: DayOfWeekEnum,
    exercise_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(PlannedExercise).where(
            PlannedExercise.user_id == current_user.user_id,
            PlannedExercise.day == day.value,
            PlannedExercise.exercise_id == exercise_id,
        )
    )
    await db.commit()


@router.get("/search-exercises")
async def search_exercises(q: str, current_user: User = Depends(get_current_user)):
    term = q.strip()
    if not term:
        return []

    await fetch_and_cache_exercises()
    exercises = get_exercise_stats()

    matches = exercises["exercise_name"].str.contains(
        term, case=False, regex=False, na=False
    )
    return (
        exercises.loc[matches, ["exercise_id", "exercise_name"]]
        .head(20)
        .to_dict(orient="records")
    )
