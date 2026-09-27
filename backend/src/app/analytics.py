import pandas as pd
import asyncio
import uuid 
from sqlalchemy import select
from db import async_session_maker, DailyEntry, DailyScore, TargetPlan, User

# 1. Daily Entries DataFrame
async def get_entries_by_id(current_user_id: uuid.UUID) -> pd.DataFrame:
    async with async_session_maker() as session:
        stmt = select(DailyEntry).where(DailyEntry.user_id == current_user_id).order_by(DailyEntry.entry_date.asc())
        result = await session.execute(stmt)
        entries = result.scalars().all()

        return pd.DataFrame([
            {
                "entry_date": entry.entry_date,
                "sleep": entry.sleep,
                "energy_level": entry.energy_level,
                "soreness": entry.soreness,
                "stress": entry.stress,
                "heart_rate": entry.heart_rate,
                "duration": entry.duration,
                "difficulty": entry.difficulty
            }
            for entry in entries
        ])

# 2. Daily Score DataFrame
async def get_daily_score(user_id: uuid.UUID) -> pd.DataFrame:
    async with async_session_maker() as session:
        daily_score_data = select(DailyScore).where(DailyScore.user_id == user_id).order_by(DailyScore.score_date.asc())
        score_result = await session.execute(daily_score_data)
        scores = score_result.scalars().all()

        return pd.DataFrame([
            {
                "score_date": score.score_date,
                "recovery": score.recovery,
                "fatigue": score.fatigue,
                "workload_balance_score": score.workload_balance_score,
                "final_training_score": score.final_training_score,
                "readiness_level": score.readiness_level,
                "workout_adjustment": score.workout_adjustment
            }
            for score in scores
        ])

# 3. Target Plan DataFrame
async def get_target_plan(user_id: uuid.UUID) -> pd.DataFrame:
    async with async_session_maker() as session:
        target_data = select(TargetPlan).where(TargetPlan.user_id == user_id)
        target_result = await session.execute(target_data)
        plans = target_result.scalars().all()

        return pd.DataFrame([
            {
                "duration_goal": plan.duration_goal,
                "sets_goal": plan.sets_goal,
                "reps_goal": plan.reps_goal,
                "weights_goal": plan.weights_goal,
                "rest_time_goal": plan.rest_time_goal
            }
            for plan in plans
        ])

#create the actual dash board for the user 

#compute averages for the user across 7 days

#combine metrics into 1 recovery score

#apply readiness matrix mapping 


#show user trends from data 