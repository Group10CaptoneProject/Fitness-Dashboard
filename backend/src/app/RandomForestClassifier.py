"""Exercise catalog integration and personalized training recommendations."""
import pandas as pd 
import os
import httpx 
import json
import asyncio
from datetime import date
from time import monotonic
from math import floor, isfinite
from typing import Optional
from sqlalchemy import select
from fastapi import Depends, APIRouter, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from .db import User, UserFitnessProfile, UserProfile, DailyEntry, TargetPlan, MuscleCategoryEnum, MuscleGroupEnum, ExperienceLevelEnum, EquipmentEnum, GoalEnum, get_db, RejectedExercise
from .analytics import get_entries_by_id, get_daily_score, get_target_plan, get_user_profile, get_rejected_exercises
from .security import get_current_user
from .routes.profile import get_fitness_profile
from .schema import RejectedExerciseCreate 

router = APIRouter(prefix="/analytics", tags=["Analytics & Recommendations"])

def normalized_values(value):
    """Accept API arrays and comma-separated profile values."""
    if value is None:
        return ()
    values = value if isinstance(value, (list, tuple)) else str(value).split(",")
    return tuple(str(item).strip().lower() for item in values if str(item).strip())

#save api data locally
async def fetch_and_cache_exercises():
    if os.path.exists("exercises_cache.json"):
        return

    url = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            exercise_data = response.json()
            if not isinstance(exercise_data, list) or not exercise_data:
                raise ValueError("Exercise service returned no exercise data")
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(status_code=502, detail="Exercise service is unavailable. Please try again later.") from exc

    with open("exercises_cache.json", "w") as f:
        json.dump(exercise_data, f)
    print("Successfully cached exercises locally!")

#get exercise info from exercise API
def get_exercise_stats() -> pd.DataFrame:
    #get key info from exercise db api
    if not os.path.exists("exercises_cache.json"):
        print("Cache not found. Please run fetch_and_cache_exercises() first.")
        return pd.DataFrame(columns=["exercise_id", "exercise_name", "required_equipment", "muscle_group", "targeted_muscles"])

    with open("exercises_cache.json", "r") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data = data.get("data", data.get("exercises", []))
        if isinstance(data, dict):
            data = data.get("exercises", [])

    #loop through JSON file 
    exercise_stats = []
    equipment_names = {
        "body only": "bodyweight", "body weight": "bodyweight", "dumbbell": "dumbbells",
        "kettlebells": "kettlebells", "bands": "resistance_bands",
        "machine": "machines", "exercise ball": "exercise_ball",
    }
    body_parts = {
        "lats": "back", "middle back": "back", "lower back": "back", "traps": "back",
        "quadriceps": "quads", "abdominals": "abs",
    }
    for item in data:
        muscles = item.get("primaryMuscles", [])
        equipment = item.get("equipment")
        exercise_stats.append({
            "exercise_id": item.get("exerciseId") or item.get("id"),
            "exercise_name": item.get("name"),
            "required_equipment": tuple(equipment_names.get(eq, eq) for eq in normalized_values(item.get("equipments", equipment))),
            "muscle_group": normalized_values(item.get("bodyParts", list(dict.fromkeys(body_parts.get(m, m) for m in muscles)))),
            "targeted_muscles": normalized_values(item.get("targetMuscles", muscles)),
            "gif_url": item.get("gifUrl")
        })

    #convert key properties to df
    return pd.DataFrame(exercise_stats, columns=["exercise_id", "exercise_name", "required_equipment", "muscle_group", "targeted_muscles", "gif_url"])

#for exercise w/ weights
@router.post("/weight-adjustment")
async def calculate_weight_adjustment(current_user: User = Depends(get_current_user), db:AsyncSession = Depends(get_db)):
    #get the daily entry for user
    current_user_id = current_user.user_id
    user_entries = await get_entries_by_id(current_user_id)

    #user data metrics 
    if user_entries.empty:
        return None # Or handle the case where there is no history yet

    #grab the most recent row using .iloc[-1]
    latest_entry = user_entries.iloc[-1]
    
    #extract the values from that latest row
    current_weight = latest_entry['weight']
    current_reps = latest_entry['reps']
    current_sets = latest_entry['sets']
    current_stress = latest_entry['stress']
    current_difficulty = latest_entry['difficulty']

    #get target plan for user 
    current_plan = await get_target_plan(current_user_id)
    goal_weight = current_plan['weights_goal'].iloc[-1] if not current_plan.empty else 0
    goal_reps = current_plan['reps_goal'].iloc[-1] if not current_plan.empty else 0
    goal_sets = current_plan['sets_goal'].iloc[-1] if not current_plan.empty else 0

    #get user profile info (experience, primary goal, equipment avaliable)
    user_profile_data = await get_user_profile(current_user_id)
    if user_profile_data:
        experience_level = str(user_profile_data.experience_level).lower()
        goal = str(user_profile_data.primary_goal).lower()
        equipment_available = user_profile_data.equipment_available
        primary_goal = user_profile_data.goal

    else:
        experience_level = "beginnger"
        goal = "healthy_lifestyle"
        equipment_available = ["bodyweight", "dumbbells", "kettlebells", "Resistance Bands", "Barbell"]

    #tree logic here: stress -> experience -> reps -> difficulty 
    recommended_weight = current_weight
    if equipment_available:
        #3-4 sets. 8-12 reps. 2 min rest time for hypertropy
        if primary_goal == "endurance" or primary_goal == "healthy_lifestyle":    
            if current_stress > 7:
                if experience_level == "beginner":
                    recommended_weight = current_weight * 0.9
                elif experience_level == "intermediate" or experience_level == "advanced":
                    recommended_weight = current_weight * 0.95
                else:
                    print("Enter 'beginner', 'intermediate' or 'advanced'")
            
            if current_reps < 8:
                recommended_weight = current_weight - 5
            elif 8 <= current_reps < 11:
                if current_difficulty < 7:
                    if experience_level == "beginner":
                        recommended_weight = current_weight + 2
                    else:
                        recommended_weight = current_weight + 5
                elif 7 <= current_difficulty < 9:
                    recommended_weight = current_weight 
            else:
                    if experience_level == "beginner":
                        recommended_weight = current_weight -10
                    elif experience_level == "intermediate":
                        recommended_weight = current_weight -5
                    else:
                        recommended_weight = current_weight - 2  

        #strength: 6-8 reps. 2-3 reps. 3-5 min rest. 
        if primary_goal == "hypertrophy":
            if current_stress > 7:
                if experience_level == "beginner":
                    recommended_weight = current_weight * 0.9
                elif experience_level == "intermediate" or experience_level == "advanced":
                    recommended_weight = current_weight * 0.95
                else:
                    print("Enter 'beginner', 'intermediate' or 'advanced'")
                        
            if current_reps < 6:
                recommended_weight = current_weight - 5
            elif 6 <= current_reps < 8:
                if current_difficulty < 7:
                    if experience_level == "beginner":
                        recommended_weight = current_weight + 2
                    else:
                        recommended_weight = current_weight + 5
                else:
                    recommended_weight = current_weight 
            else:
                if experience_level == "beginner":
                    recommended_weight = current_weight -10
                elif experience_level == "intermediate":
                    recommended_weight = current_weight -5
                else:
                    recommended_weight = current_weight - 2

        return recommended_weight
    else:
        return recommended_weight

#next exercise 
FOCUS_MUSCLES = {
    "upper_body": {"chest", "back", "biceps", "triceps", "shoulders", "forearms", "upper arms", "lower arms", "lats", "traps", "middle back", "lower back"},
    "lower_body": {"quads", "quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors", "upper legs", "lower legs"},
    "cardio_core": {"abs", "abdominals", "obliques", "waist", "cardio", "cardiovascular system"},
}


def goal_priority(row, goal):
    """Rank catalog movements using explicit goal heuristics; preserve ties."""
    equipment = set(row["required_equipment"])
    name = row["exercise_name"].lower()
    loaded = bool(equipment & {"dumbbells", "barbell", "kettlebells", "machines", "cable", "resistance_bands"})
    conditioning = any(word in name for word in ("run", "jog", "jump", "burpee", "cycling", "rowing"))
    compound = any(word in name for word in ("squat", "deadlift", "press", "pull-up", "push-up", "lunge", "row"))
    if goal == "hypertrophy":
        return 2 * loaded + compound - 2 * conditioning
    if goal == "endurance":
        return 2 * conditioning + ("bodyweight" in equipment)
    return compound + ("bodyweight" in equipment)


@router.get("/exercise-recommendation")
async def exercise_recommendation(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), target_date: Optional[date] = None,
                                  goal: Optional[GoalEnum] = None, focus: Optional[MuscleCategoryEnum] = None,
                                  equipment: Optional[list[str]] = Query(default=None)):
    if target_date is None:
        target_date = date.today()
    
    current_user_id = current_user.user_id
    
    #get the prefered muscle groups 
    await fetch_and_cache_exercises()
    exercise_data = get_exercise_stats()

    #rejected exercises
    rejected_exercises = await get_rejected_exercises(current_user_id, target_date)
    rejected_exercise_ids = set(rejected_exercises["exercise_id"])

    #get user equipment
    user_profile = await get_user_profile(current_user_id)
    selected_equipment = equipment if equipment is not None else (user_profile.equipment_available if user_profile else [])
    if not selected_equipment:
        return {"day": target_date.strftime('%A').lower(), "recommendations": [], "equipment_available": []}
    
    user_equipment = [eq.strip().lower() for eq in selected_equipment if eq.strip()]
    selected_goal = goal.value if goal else getattr(user_profile, "primary_goal", "healthy_lifestyle")
    selected_goal = getattr(selected_goal, "value", selected_goal)
    sets, reps, rest_seconds = {
        "hypertrophy": (3, 8, 120),
        "endurance": (3, 15, 60),
        "healthy_lifestyle": (2, 10, 90),
    }.get(selected_goal, (2, 10, 90))
    
    #only filter through exercises user can do based on equipment they have
    available_exercises = exercise_data[
        exercise_data['required_equipment'].apply(
            lambda eq: any(e in user_equipment for e in eq)
        ) & ~exercise_data['exercise_id'].isin(rejected_exercise_ids)
    ]

    #user can choose what they want to work out each day. 
    fitness_profile = await get_fitness_profile(current_user, db)
    target_day_name = target_date.strftime('%A').lower()

    today_muscle_groups = []
    if fitness_profile and fitness_profile.weekly_split:
        #get the muscle groups for user
        weekly_split = {day.lower(): groups for day, groups in fitness_profile.weekly_split.items()}
        today_muscle_groups = normalized_values(weekly_split.get(target_day_name, []))

    #only recommend exercises that fit w/ today's muscle groups
    if focus:
        focus_muscles = FOCUS_MUSCLES[focus.value]
        available_exercises = available_exercises[available_exercises.apply(
            lambda row: bool(focus_muscles.intersection((*row['muscle_group'], *row['targeted_muscles']))), axis=1)]
    elif today_muscle_groups:
        available_exercises = available_exercises[available_exercises['muscle_group'].apply(lambda groups: any(group in today_muscle_groups for group in groups))]
    
    user_entries = await get_entries_by_id(current_user_id)

    #keep track of sub-muscles worked out. AVOID REPITION
    targeted_muscles_worked_out = set()
    if not user_entries.empty:
        user_entries['entry_date'] = pd.to_datetime(user_entries['entry_date']).dt.date
        today_entries = user_entries[user_entries['entry_date'] == target_date]

        for i, entry in today_entries.iterrows():
            matched_exercise = exercise_data[exercise_data['exercise_name'] == entry.get('exercise_name')]
            if not matched_exercise.empty:
                targeted_muscles_worked_out.update(matched_exercise.iloc[0]['targeted_muscles'])

        # 2. 48-HOUR RECOVERY BUFFER: Check the latest entry to enforce recovery rules
        latest_entry = user_entries.sort_values('entry_date').iloc[-1]
        latest_date = latest_entry['entry_date']
        
        # If the last workout was less than 2 days ago, block that muscle group
        if (target_date - latest_date).days < 2 and (target_date - latest_date).days >= 0:
            recent_exercise = exercise_data[exercise_data['exercise_name'] == latest_entry.get('exercise_name')]
            recent_groups = set(group for groups in recent_exercise['muscle_group'] for group in groups)
            
            # Find any exercises matching this recent group and add their targets to the exclusion set
            recent_matches = exercise_data[exercise_data['muscle_group'].apply(lambda groups: bool(recent_groups.intersection(groups)))]
            for _, row in recent_matches.iterrows():
                targeted_muscles_worked_out.update(row['targeted_muscles'])


    #loop through exericses and get up to 3 
    recommended_exercises = []
    muscle_group_counts = {}  # Tracks how many exercises we've picked per muscle group
    max_per_muscle_group = 3  # Prevents spamming the same muscle group
    total_target_exercises = 9  # Total size of the workout

    ranked_exercises = sorted((row for _, row in available_exercises.iterrows()),
                              key=lambda row: goal_priority(row, selected_goal), reverse=True)
    for row in ranked_exercises:
        muscle_group = row['muscle_group']
        target_muscles = row['targeted_muscles']
        exercise_name = row['exercise_name']     
        exercise_id = row['exercise_id']   

        if muscle_group not in muscle_group_counts:
            muscle_group_counts[muscle_group] = 0
        
        #hard cap at 2 exercises per muscle
        if targeted_muscles_worked_out.isdisjoint(target_muscles) and muscle_group_counts[muscle_group] < max_per_muscle_group:
            targeted_muscles_worked_out.update(target_muscles)
            muscle_group_counts[muscle_group] += 1 
            recommended_exercise = {
                "id": exercise_id,
                "name": exercise_name,
                "target_muscle": target_muscles,
                "equipment": row["required_equipment"],
                "gif_url": row.get("gif_url"),
                "sets": sets,
                "reps": reps,
                "rest_seconds": rest_seconds,
            }
            recommended_exercises.append(recommended_exercise)

            if len(recommended_exercises) >= total_target_exercises:
                break 

    return {
        "day": target_day_name,
        "equipment_available": user_equipment,
        "recommendations": recommended_exercises
    }

@router.post("/removed-exercise")
async def save_removed_exercise(request: RejectedExerciseCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), target_date: Optional[date] = None):
    current_user_id = current_user.user_id
    
    #get exercise id + date from frotntend
    rejected_exercise_id = request.exercise_id 
    rejectDate = request.rejection_date 

    #create entry for rejected exercise
    rejected_exercise = RejectedExercise(
        user_id = current_user_id,
        exercise_id = rejected_exercise_id,
        rejection_date = rejectDate
    )

    #store in database
    stmt = (select(RejectedExercise.user_id, RejectedExercise.exercise_id, RejectedExercise.rejection_date, RejectedExercise.rejection_id)
    .where(RejectedExercise.user_id == current_user_id, RejectedExercise.exercise_id == rejected_exercise_id, RejectedExercise.rejection_date == rejectDate)
    )

    result = await db.execute(stmt)

    #check if exists 
    existing_rejection = result.scalar_one_or_none()

    #check if it texists
    if existing_rejection:
        return {"message": "Exercise already in rejected exercises list"}
    else:
        db.add(rejected_exercise)
        await db.commit()  
        return {"message": "Exercises succesffuly rejected"}      
