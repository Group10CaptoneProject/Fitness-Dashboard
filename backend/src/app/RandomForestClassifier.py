from sklearn.ensemble import RandomForestClassifier
import uuid
from sqlalchemy.dialects.postgresql import UUID

from db import UserFitnessProfile, UserProfile, DailyEntry, TargetPlan
from analytics import get_entries_by_id, get_daily_score, get_target_plan, get_user_dashboard, get_user_profile, get_user_fitness_profile

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
    goal_weight = current_plan['weight_goal'].iloc[-1]
    goal_reps = current_plan['reps_goal'].iloc[-1]
    goal_sets = current_plan['sets_goal'].iloc[-1]

    #get user profile info (experience, primary goal, equipment avaliable)
    

    #tree logic here: stress -> experience -> reps -> difficulty 

