"""Regression coverage for the Training Plan preview query parameters."""
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pandas as pd
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import RandomForestClassifier as recommendations
from app.db import get_db
from app.security import get_current_user


class TrainingFilterTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(recommendations.router)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id="test")

        async def database():
            yield AsyncMock()

        app.dependency_overrides[get_db] = database
        self.client = TestClient(app)
        catalog = pd.DataFrame([
            dict(exercise_id="curl", exercise_name="Dumbbell curl", required_equipment=("dumbbells",),
                 muscle_group=("biceps",), targeted_muscles=("biceps",), gif_url=None),
            dict(exercise_id="pull", exercise_name="Bodyweight pull-up", required_equipment=("bodyweight",),
                 muscle_group=("back",), targeted_muscles=("lats",), gif_url=None),
            dict(exercise_id="squat", exercise_name="Squat", required_equipment=("bodyweight",),
                 muscle_group=("quads",), targeted_muscles=("quadriceps",), gif_url=None),
            dict(exercise_id="crunch", exercise_name="Crunch", required_equipment=("bodyweight",),
                 muscle_group=("abs",), targeted_muscles=("abdominals",), gif_url=None),
        ])
        mocks = {
            "fetch_and_cache_exercises": AsyncMock(),
            "get_exercise_stats": lambda: catalog,
            "get_rejected_exercises": AsyncMock(return_value=pd.DataFrame(columns=["exercise_id"])),
            "get_user_profile": AsyncMock(return_value=SimpleNamespace(
                primary_goal="hypertrophy", equipment_available=["dumbbells", "bodyweight"])),
            "get_fitness_profile": AsyncMock(return_value=SimpleNamespace(weekly_split={"monday": ["biceps"]})),
            "get_entries_by_id": AsyncMock(return_value=pd.DataFrame()),
        }
        for name, value in mocks.items():
            patcher = patch.object(recommendations, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def request(self, **params):
        return self.client.get("/analytics/exercise-recommendation", params={"target_date": "2026-11-02", **params})

    def test_focus_overrides_saved_split(self):
        for focus, expected in [("upper_body", {"curl", "pull"}), ("lower_body", {"squat"}), ("cardio_core", {"crunch"})]:
            with self.subTest(focus=focus):
                response = self.request(focus=focus)
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual({item["id"] for item in response.json()["recommendations"]}, expected)
        self.assertEqual([item["id"] for item in self.request().json()["recommendations"]], ["curl"])

    def test_goal_changes_ranking_and_prescription(self):
        for goal, first, prescription in [("hypertrophy", "curl", (3, 8, 120)),
                                           ("endurance", "pull", (3, 15, 60)),
                                           ("healthy_lifestyle", "pull", (2, 10, 90))]:
            with self.subTest(goal=goal):
                item = self.request(goal=goal, focus="upper_body").json()["recommendations"][0]
                self.assertEqual(item["id"], first)
                self.assertEqual((item["sets"], item["reps"], item["rest_seconds"]), prescription)

    def test_equipment_preview_and_invalid_filters(self):
        items = self.request(focus="upper_body", equipment="bodyweight").json()["recommendations"]
        self.assertEqual([item["id"] for item in items], ["pull"])
        self.assertEqual(self.request(equipment="").json()["recommendations"], [])
        self.assertEqual(self.request(goal="invalid").status_code, 422)
        self.assertEqual(self.request(focus="invalid").status_code, 422)
