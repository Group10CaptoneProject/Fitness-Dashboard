"""Exercise catalog integration and personalized training recommendations."""

import asyncio
from datetime import date
from time import monotonic
from math import floor, isfinite
from typing import Optional

import httpx
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config.config import settings
from .db import User, UserProfile, UserFitnessProfile, GoalEnum, MuscleCategoryEnum, get_db
from .analytics import get_entries_by_id, get_target_plan, get_user_profile, get_daily_score
from .security import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Recommendations"])
_catalog = []
_catalog_url = None
_catalog_expires = 0
_catalog_lock = asyncio.Lock()


def normalize(value):
    return str(getattr(value, "value", value)).strip().lower().replace("_", " ")


def values(value):
    if not value:
        return []
    return [normalize(item) for item in (value if isinstance(value, list) else value.split(","))]


def equipment_name(value):
    name = normalize(value)
    return {
        "body weight": "bodyweight", "dumbbell": "dumbbells",
        "kettlebell": "kettlebells", "band": "resistance bands",
        "resistance band": "resistance bands", "leverage machine": "machines",
        "smith machine": "machines", "sled machine": "machines",
    }.get(name, name)


async def fetch_and_cache_exercises():
    """Load a configured JSON catalog, with a short in-memory cache."""
    global _catalog, _catalog_url, _catalog_expires
    url = settings.exercise_data_url
    async with _catalog_lock:
        if _catalog and _catalog_url == url and monotonic() < _catalog_expires:
            return _catalog
        headers = {}
        if "rapidapi.com" == httpx.URL(url).host or (httpx.URL(url).host or "").endswith(".rapidapi.com"):
            if not settings.EXERCISEDB_API_KEY:
                raise HTTPException(503, "The configured exercise provider requires EXERCISEDB_API_KEY.")
            headers = {"x-rapidapi-key": settings.EXERCISEDB_API_KEY, "x-rapidapi-host": httpx.URL(url).host}
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
            if isinstance(data, dict):
                data = data.get("data", data.get("exercises"))
                if isinstance(data, dict):
                    data = data.get("exercises")
            if not isinstance(data, list) or not data:
                raise ValueError("Expected a non-empty exercise list")
            catalog = []
            for item in data:
                if not isinstance(item, dict) or not item.get("name"):
                    continue
                gif = item.get("gifUrl") or item.get("gif_url")
                if not isinstance(gif, str) or not gif.startswith(("https://", "http://")):
                    continue
                catalog.append({
                    "id": str(item.get("exerciseId") or item.get("id") or item["name"]),
                    "name": item["name"],
                    "equipment": values(item.get("equipments") or item.get("equipment")),
                    "body_parts": values(item.get("bodyParts") or item.get("bodyPart")),
                    "target_muscles": values(item.get("targetMuscles") or item.get("target")),
                    "gif_url": gif,
                })
            if not catalog:
                raise ValueError("No exercises with GIF URLs in catalog")
        except (httpx.HTTPError, ValueError, TypeError) as exc:
            raise HTTPException(502, "Exercise catalog unavailable. Check EXERCISE_DATA_URL or try again later.") from exc
        _catalog, _catalog_url, _catalog_expires = catalog, url, monotonic() + 3600
        return _catalog


# Map the provider's detailed targets to the muscle names used in onboarding.
MUSCLE_ALIASES = {
    "pectorals": "chest", "lats": "back", "traps": "back", "spine": "back",
    "delts": "shoulders", "quadriceps": "quads", "abductors": "glutes",
    "adductors": "quads", "cardiovascular system": "cardio",
    "upper back": "back", "levator scapulae": "neck", "serratus anterior": "chest",
}
FOCUS_GROUPS = {
    "upper_body": {"chest", "back", "biceps", "triceps", "shoulders", "forearms", "neck"},
    "lower_body": {"quads", "hamstrings", "glutes", "calves"},
    "cardio_core": {"abs", "cardio"},
}


def muscle_groups(exercise):
    return {MUSCLE_ALIASES.get(muscle, muscle) for muscle in exercise["target_muscles"] + exercise["body_parts"]}


def goal_priority(exercise, goal):
    """Transparent ranking rules; catalog metadata does not contain goal labels."""
    name = exercise["name"].lower()
    equipment = {equipment_name(item) for item in exercise["equipment"]}
    loaded = bool(equipment & {"dumbbells", "barbell", "kettlebells", "machines", "cable"})
    bodyweight = "bodyweight" in equipment
    compound = any(word in name for word in ("squat", "deadlift", "press", "row", "pull-up", "pull up", "push-up", "push up", "lunge"))
    conditioning = "cardio" in muscle_groups(exercise) or any(
        word in name for word in ("burpee", "jump", "running", "mountain climber", "cycling", "skipping"))
    if goal == "hypertrophy":
        return 4 * loaded + 2 * compound - 3 * conditioning
    if goal == "endurance":
        return 5 * conditioning + 2 * bodyweight + ("resistance bands" in equipment)
    return 3 * compound + 2 * bodyweight + conditioning


GOAL_PRESCRIPTIONS = {
    "hypertrophy": {"sets": 3, "reps": 8, "rest_seconds": 120},
    "endurance": {"sets": 3, "reps": 15, "rest_seconds": 45},
    "healthy_lifestyle": {"sets": 2, "reps": 10, "rest_seconds": 60},
}


class ExerciseRecommendation(BaseModel):
    id: str
    name: str
    target_muscle: list[str]
    equipment: list[str]
    gif_url: str
    sets: int
    reps: int
    rest_seconds: int
    original_sets: int
    original_reps: int
    reps_by_set: list[int]
    total_reps: int


class TrainingRecommendations(BaseModel):
    day: str
    recommendations: list[ExerciseRecommendation]
    goal: str
    equipment_available: list[str]
    muscle_groups: list[str]
    message: Optional[str] = None
    final_training_score: Optional[float] = None
    readiness_level: Optional[str] = None
    workout_adjustment: float = 1.0


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
        experience_level = normalize(user_profile_data.experience_level)
        goal = user_profile_data.primary_goal.value
        equipment_available = user_profile_data.equipment_available
        primary_goal = goal

    else:
        experience_level = "beginner"
        primary_goal = "healthy_lifestyle"
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

@router.get("/exercise-recommendation", response_model=TrainingRecommendations)
async def exercise_recommendation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    target_date: Optional[date] = None,
    goal: Optional[GoalEnum] = None,
    focus: Optional[MuscleCategoryEnum] = None,
    equipment: Optional[list[str]] = Query(default=None),
):
    """Recommend exercises for the signed-in user's equipment and daily split.

    Query filters apply to this preview only; saved profile preferences are unchanged.
    """
    target_date = target_date or date.today()
    day = target_date.strftime("%A").lower()
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.user_id))
    fitness = await db.scalar(select(UserFitnessProfile).where(UserFitnessProfile.user_id == current_user.user_id))
    selected_goal = (goal or (profile.primary_goal if profile else None) or GoalEnum.HEALTHY_LIFESTYLE).value
    available = equipment if equipment is not None else (profile.equipment_available if profile else ["bodyweight"])
    available = [item for item in available if item.strip()]
    split = {key.lower(): value for key, value in (fitness.weekly_split or {}).items()} if fitness else {}
    groups = {MUSCLE_ALIASES.get(item, item) for item in values(split.get(day))}
    if focus:
        groups = FOCUS_GROUPS[focus.value]
    result = {"day": day, "goal": selected_goal, "equipment_available": available,
              "muscle_groups": sorted(groups), "recommendations": [], "message": None}
    scores = await get_daily_score(current_user.user_id)
    if not scores.empty:
        dated = scores[pd.to_datetime(scores["score_date"]).dt.date == target_date]
        if not dated.empty:
            score = float(dated.iloc[-1]["final_training_score"])
            if isfinite(score) and 0 <= score <= 100:
                # Use the saved Final Training Score with the same bands as analytics.py.
                readiness, factor = next((label, multiplier) for threshold, label, multiplier in (
                    (80, "High readiness", 1.05), (60, "Good readiness", 1.0),
                    (40, "Reduced readiness", 0.9), (20, "Low readiness", 0.75),
                    (0, "Very low readiness", 0.0),
                ) if score >= threshold)
                result.update(final_training_score=score, readiness_level=readiness, workout_adjustment=factor)
    if result.get("workout_adjustment") == 0:
        result["message"] = "Rest or gentle activity. Skip the planned workout based on today’s training score."
        return result
    if not available:
        result["message"] = "Choose available equipment to see recommendations."
        return result
    if not focus and day in split and not values(split[day]):
        result["message"] = "Today is a rest day in your weekly split."
        return result

    catalog = await fetch_and_cache_exercises()
    entries = await get_entries_by_id(current_user.user_id)
    recovering = set()
    completed = set()
    by_name = {exercise["name"].lower(): exercise for exercise in catalog}
    for _, entry in entries.iterrows():
        entry_date = pd.Timestamp(entry["entry_date"]).date()
        days_ago = (target_date - entry_date).days
        if not 0 <= days_ago < 2:
            continue
        name = str(entry.get("exercise_name", "")).lower()
        completed.add(name)
        if name in by_name:
            recovering.update(muscle_groups(by_name[name]))
        # Daily entries can also identify their muscle group without a catalog match.
        group = entry.get("muscle_group")
        if group:
            recovering.add(normalize(group))

    user_equipment = {equipment_name(item) for item in available}
    counts = {}
    seen = set()
    ranked = sorted(catalog, key=lambda exercise: (-goal_priority(exercise, selected_goal), exercise["name"].lower(), exercise["id"]))
    for exercise in ranked:
        required = {equipment_name(item) for item in exercise["equipment"]}
        muscles = muscle_groups(exercise)
        if not required or not required.issubset(user_equipment):
            continue
        if groups and not muscles.intersection(groups):
            continue
        if muscles.intersection(recovering) or exercise["name"].lower() in completed:
            continue
        if exercise["id"] in seen:
            continue
        primary = exercise["target_muscles"][0] if exercise["target_muscles"] else exercise["body_parts"][0] if exercise["body_parts"] else "other"
        if counts.get(primary, 0) >= 3:
            continue
        counts[primary] = counts.get(primary, 0) + 1
        seen.add(exercise["id"])
        baseline = GOAL_PRESCRIPTIONS[selected_goal]
        factor = result.get("workout_adjustment", 1.0)
        # Scale total repetition volume once, then distribute whole reps across sets.
        total_reps = max(baseline["sets"], floor(baseline["sets"] * baseline["reps"] * factor + 0.5))
        per_set, extra = divmod(total_reps, baseline["sets"])
        reps_by_set = [per_set + (index < extra) for index in range(baseline["sets"])]
        result["recommendations"].append({
            "id": exercise["id"], "name": exercise["name"],
            "target_muscle": exercise["target_muscles"], "equipment": exercise["equipment"],
            "gif_url": exercise["gif_url"],
            **baseline,
            "reps": reps_by_set[0], "original_sets": baseline["sets"],
            "original_reps": baseline["reps"], "reps_by_set": reps_by_set, "total_reps": total_reps,
        })
        if len(result["recommendations"]) >= 5:
            break
    if not result["recommendations"]:
        result["message"] = "No exercises match your equipment, focus, and recent recovery history. Try another focus or allow more recovery time."
    return result
