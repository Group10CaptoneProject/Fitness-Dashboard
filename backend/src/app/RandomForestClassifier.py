from sklearn.ensemble import RandomForestClassifier
import uuid
import pandas as pd
import httpx
import json 
import os
from sqlalchemy.dialects.postgresql import UUID
from datetime import date, timedelta

from db import UserFitnessProfile, UserProfile, DailyEntry, TargetPlan, MuscleCategoryEnum, MuscleGroupEnum, ExperienceLevelEnum, EquipmentEnum, GoalEnum
from analytics import get_entries_by_id, get_daily_score, get_target_plan, get_user_dashboard, get_user_profile, get_user_fitness_profile

#save api data locally
async def fetch_and_cache_exercises():
    # Example pattern for fetching from a public API and caching
    url = "https://raw.githubusercontent.com/ExerciseDB/exercisedb-api/main/exercises.json" # (or relevant endpoint)
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            exercise_data = response.json()
            #loop through data. save to local DB
            with open("exercises_cache.json", "w") as f:
                json.dump(exercise_data, f)
            print("Successfully cached exercises locally!")

#get exercise info from exercise API
def get_exercise_stats() -> pd.DataFrame:
    #get key info from exercise db api
    if not os.path.exists("exercises_cache.json"):
        print("Cache not found. Please run fetch_and_cache_exercises() first.")
        return pd.DataFrame(columns=["exercise_name", "required_equipment", "muscle_group", "targeted_muscles"])

    with open("exercises_cache.json", "r") as f:
        data = json.load(f)

    #loop through JSON file 
    exercise_stats = []
    for item in data:
        exercise_stats.append({
            "exercise_name": item.get("name"),
            "required_equipment": item.get("equipments"),
            "muscle_group": item.get("bodyParts"),
            "targeted_muscles": item.get("targetMuscles")
        })

    #convert key properties to df
    return pd.DataFrame(exercise_stats)

#for exercise w/ weights
async def calculate_weight_adjustment(user_id: uuid.UUID):
    #get the daily entry for user
    current_user_id = user_id
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
    goal_weight = current_plan['weights_goal'].iloc[-1]
    goal_reps = current_plan['reps_goal'].iloc[-1]
    goal_sets = current_plan['sets_goal'].iloc[-1]

    #get user profile info (experience, primary goal, equipment avaliable)
    user_profile_data = await get_user_profile(current_user_id)
    experience_level = user_profile_data.experience_level
    goal = user_profile_data.primary_goal
    equipment_avaliable = user_profile_data.equipment_avaliable

    #tree logic here: stress -> experience -> reps -> difficulty 
    recommended_weight = 0
    if equipment_avaliable is not None:
        if current_stress > 7:
            if experience_level == "beginner":
                recommended_weight = current_weight - 10
            elif experience_level == "intermediate" or experience_level == "advanced":
                recommended_weight = current_weight - 5
            else:
                print("Enter 'beginner', 'intermediate' or 'advanced'")
        
        if current_reps < 6:
            recommended_weight = current_weight - 5
        elif 7 <= current_reps < 9:
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
        return recommended_weight
    else:
        return recommended_weight


#next exercise 
async def exercise_recommendation(user_id: uuid.UUID):
    current_user_id = user_id
    
    #get the prefered muscle groups 
    await fetch_and_cache_exercises()
    exercise_data = get_exercise_stats()

    #get user equipment
    user_profile = await get_user_profile(current_user_id)
    if not user_profile:
        return []
    
    equipment_avaliable = [eq.lower() for eq in user_profile.equipment_available]
    user_equipment = [eq.lower() for eq in user_profile.equipment_available]

    #only filter through exercises user can do based on equipment they have
    available_exercises = exercise_data[
        exercise_data['required_equipment'].apply(
            lambda eq: any(e.lower() in user_equipment for e in (eq if isinstance(eq, list) else [eq]))
        )
    ]
    
    user_entries = await get_entries_by_id(current_user_id)
    today = date.today()

    targeted_muscles_worked_out = set()
    muscle_groups_worked_out = set()

    if not user_entries.empty:
        user_entries['entry_date'] = pd.to_datetime(user_entries['entry_date']).dt.date
        today_entries = user_entries[user_entries['entry_date'] == today]

        for i, entry in today_entries.iterrows():
            matched_exercise = exercise_data[exercise_data['exercise_name'] == entry.get('exercise_name')]
            if not matched_exercise.empty:
                targeted_muscles_worked_out.add(matched_exercise.iloc[0]['targeted_muscles'])

    #loop through exericses and get up to 3 
    recommended_exercises = []
    current_count = 0

    for _, row in available_exercises.iterrows():
        muscle_group = row['muscle_group']
        target_muscles = row['targeted_muscles']
        exercise_name = row['exercise_name']        

        if target_muscles not in targeted_muscles_worked_out:
            targeted_muscles_worked_out.add(target_muscles)
            recommended_exercises.append(exercise_name)
            current_count += 1

            if current_count > 3:
                break 

    return recommended_exercises     