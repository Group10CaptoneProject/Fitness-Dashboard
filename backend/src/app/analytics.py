import pandas as pd
import numpy as np 
import asyncio
import uuid 
from sqlalchemy import select
from decimal import Decimal
from datetime import date
from .db import async_session_maker, MuscleCategoryEnum, MuscleGroupEnum, DailyEntry, DailyScore, TargetPlan, User

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
                "difficulty": entry.difficulty
            }
            for entry in entries
        ])

#update daily entries 
async def update_entries_by_id(
    user_id: uuid.UUID, 
    entry_date: date, 
    sleep: int, 
    energy_level: int, 
    soreness: int, 
    stress: int, 
    heart_rate: int, 
    difficulty: int
):
    async with async_session_maker() as session:
        new_entry = DailyEntry(
            user_id=user_id,
            entry_date=entry_date,
            sleep=sleep,
            energy_level=energy_level,
            soreness=soreness,
            stress=stress,
            heart_rate=heart_rate,
            difficulty=difficulty
        )

        await session.merge(new_entry)
        await session.commit()
        print(f"Successfully saved raw daily entry for {entry_date} to Neon!")


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

#update daily score 
async def update_daily_score(
    user_id: uuid.UUID, 
    score_date: date, 
    recovery: float, 
    fatigue: float, 
    workload_balance_score: float, 
    final_training_score: float, 
    readiness_level: str, 
    workout_adjustment: float
):
    async with async_session_maker() as session:
        # PostgreSQL automatically assigns score_id (autoincrement int)
        new_score = DailyScore(
            user_id=user_id,
            score_date=score_date,
            recovery=recovery,
            fatigue=fatigue,
            workload_balance_score=workload_balance_score,
            final_training_score=final_training_score,
            readiness_level=readiness_level,
            workout_adjustment=workout_adjustment
        )
        await session.merge(new_score)
        await session.commit()
        print(f"Saved score entry for {score_date} to Neon!")

#3. target plan 
async def get_target_plan(user_id: uuid.UUID) -> pd.DataFrame:
    async with async_session_maker() as session:
        target_data = select(TargetPlan).where(TargetPlan.user_id == user_id)
        target_result = await session.execute(target_data)
        plans = target_result.scalars().all()

        return pd.DataFrame([
            {
                "sets_goal": plan.sets_goal,
                "reps_goal": plan.reps_goal,
                "weights_goal": plan.weights_goal,
                "rest_time_goal": plan.rest_time_goal
            }
            for plan in plans
        ])

#update target plan
async def update_target_plan(
    user_id: uuid.UUID, 
    sets_goal: int, 
    reps_goal: int, 
    weights_goal: float, 
    rest_time_goal: int
):
    async with async_session_maker() as session:
        # PostgreSQL automatically assigns plan_id (autoincrement int)
        new_plan = TargetPlan(
            user_id=user_id,
            sets_goal=sets_goal,
            reps_goal=reps_goal,
            weights_goal=weights_goal,
            rest_time_goal=rest_time_goal
        )
        await session.merge(new_plan)
        await session.commit()
        print(f"Saved target plan for user {user_id} to Neon!")


#user dashboard
# calculate user trends  
async def calculate_readiness_data(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df 

    # 1. Metric Normalization & 7-Day Rolling Averages
    df["soreness_norm"] = 10 - df["soreness"]
    df["stress_norm"] = 10 - df["stress"]

    df["sleep_7d"] = df["sleep"].rolling(window=7, min_periods=1).mean()
    df["energy_7d"] = df["energy_level"].rolling(window=7, min_periods=1).mean()
    df["soreness_7d"] = df["soreness_norm"].rolling(window=7, min_periods=1).mean()
    df["stress_7d"] = df["stress_norm"].rolling(window=7, min_periods=1).mean()

    # 2. Composite Recovery Score (0-100)
    df["recovery"] = (
        (df["sleep_7d"] / 10 * 0.35) +
        (df["energy_7d"] / 10 * 0.25) +
        (df["soreness_7d"] / 10 * 0.20) +
        (df["stress_7d"] / 10 * 0.20)
    ) * 100

    df["fatigue"] = ((df["soreness"] + df["stress"]) / 20) * 100
    df["workload_balance"] = (df["duration"] * df["difficulty"]) / 10
    df["final_training_score"] = df["recovery"].clip(0, 100).round(2)

    # 3. Vectorized Readiness Matrix Conditions
    conditions = [
        (df["final_training_score"] >= 80),
        (df["final_training_score"] >= 60) & (df["final_training_score"] < 80),
        (df["final_training_score"] >= 40) & (df["final_training_score"] < 60),
        (df["final_training_score"] >= 20) & (df["final_training_score"] < 40),
        (df["final_training_score"] < 20)
    ]

    readiness_choices = ["High_readiness", "Good_readiness", "Reduced_readiness", "Low_readiness", "Very_low_readiness"]
    adjustment_choices = [1.05, 1.00, 0.90, 0.75, 0.00]

    df["readiness_level"] = np.select(conditions, readiness_choices, default="Moderate")
    df["workout_adjustment"] = np.select(conditions, adjustment_choices, default=1.00)

    return df

#4. #update user dashbaord table by writing data into daily score table
async def update_user_dashboard(user_id: uuid.UUID, score_date: date, dashboard: pd.DataFrame):
    matching_rows = dashboard[dashboard["entry_date"] == score_date]

    if matching_rows.empty:
        print(f"No calculations found for date: {score_date}")
        return 

    row = matching_rows.iloc[0]

    async with async_session_maker() as session:
        #entry 
        score_record = DailyScore(
            user_id=user_id,
            score_date=score_date,
            recovery=float(row["recovery"]),
            fatigue=float(row["fatigue"]),
            workload_balance_score=float(row["workload_balance"]),
            final_training_score=float(row["final_training_score"]), 
            readiness_level=str(row["readiness_level"]),
            workout_adjustment=float(row["workout_adjustment"])
        )

        #commit changes 
        await session.merge(score_record)
        await session.commit()
        print(f"Successfully saved daily scores for {score_date} to Neon!")

#get user data from dashboard
async def get_user_dashboard(user_id: uuid.UUID) -> pd.DataFrame:
    #get daily entry and daily score
    entries = await get_entries_by_id(user_id)
    daily_score = await get_daily_score(user_id)

    if entries.empty or daily_score.empty:
        return entries

    #create the actual dash board for the user
    user_dashboard = pd.merge(
        entries,
        daily_score[["score_date", "final_training_score", "readiness_level", "workout_adjustment"]],
        left_on="entry_date",
        right_on="score_date",
        how="inner"
    ).drop(columns=["score_date"])

    return user_dashboard

#run data here
async def main():
    test_user_id = uuid.UUID("your-user-uuid-here")
    today = date.today()

    # STEP 1: User fills out form -> Save raw input to daily_entries table
    await update_entries_by_id(
        user_id=test_user_id,
        entry_date=today,
        sleep=8,
        energy_level=7,
        soreness=3,
        stress=4,
        heart_rate=65,
        difficulty=7
    )

    # STEP 2: Fetch all raw entries into Pandas & run readiness analytics
    raw_df = await get_entries_by_id(test_user_id)
    processed_df = await calculate_readiness_data(raw_df)

    # STEP 3: Save the calculated results into daily_scores table
    await update_user_dashboard(test_user_id, today, processed_df)

    # STEP 4: Fetch merged view for dashboard display
    dashboard_df = await get_user_dashboard(test_user_id)
    print(dashboard_df)