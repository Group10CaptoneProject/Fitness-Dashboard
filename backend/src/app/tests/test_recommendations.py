"""Run with: python -m unittest discover -s src/app/tests -p test_recommendations.py"""
import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
import pandas as pd
from fastapi.testclient import TestClient

from app import RandomForestClassifier as recommendations
from app.db import get_db, GoalEnum, GoalEnumType
from app.main import app
from app.security import get_current_user


CATALOG = [
    {"exerciseId": "curl", "name": "Dumbbell curl", "equipments": ["dumbbell"],
     "bodyParts": ["upper arms"], "targetMuscles": ["biceps"], "gifUrl": "https://example.com/curl.gif"},
    {"exerciseId": "squat", "name": "Bodyweight squat", "equipments": ["body weight"],
     "bodyParts": ["upper legs"], "targetMuscles": ["quads"], "gifUrl": "https://example.com/squat.gif"},
    {"exerciseId": "press", "name": "Band press", "equipments": ["band"],
     "bodyParts": ["chest"], "targetMuscles": ["pectorals"], "gifUrl": "https://example.com/press.gif"},
]


class RecommendationTests(unittest.TestCase):
    def setUp(self):
        self.db = AsyncMock()
        self.profile = SimpleNamespace(primary_goal=GoalEnum.HYPERTROPHY,
                                       equipment_available=["dumbbells", "bodyweight"])
        self.fitness = SimpleNamespace(weekly_split={"Monday": "Biceps, Chest"})
        self.db.scalar.side_effect = lambda *args: None

        async def database():
            yield self.db

        app.dependency_overrides[get_db] = database
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id="test-user")
        self.entries = patch.object(recommendations, "get_entries_by_id", AsyncMock(return_value=pd.DataFrame()))
        self.entries_mock = self.entries.start()
        self.scores = patch.object(recommendations, "get_daily_score", AsyncMock(return_value=pd.DataFrame()))
        self.scores_mock = self.scores.start()
        self.http = patch.object(recommendations.httpx, "AsyncClient")
        self.http_mock = self.http.start()
        self.http_mock.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=httpx.Response(200, json=CATALOG, request=httpx.Request("GET", "https://example.com")))
        recommendations._catalog = []
        self.client = TestClient(app)  # No lifespan: tests must not connect to the real DB.

    def tearDown(self):
        app.dependency_overrides.clear()
        self.entries.stop()
        self.scores.stop()
        self.http.stop()
        recommendations._catalog = []

    def request(self, **params):
        self.db.scalar.side_effect = [self.profile, self.fitness]
        return self.client.get("/analytics/exercise-recommendation", params={"target_date": "2026-11-02", **params})

    def test_score_adjusts_total_rep_volume_at_every_band_boundary(self):
        for score, factor, total in [(100, 1.05, 25), (80, 1.05, 25), (79, 1, 24), (60, 1, 24),
                                     (59, .9, 22), (40, .9, 22), (39, .75, 18), (20, .75, 18),
                                     (19, 0, 0), (0, 0, 0)]:
            with self.subTest(score=score):
                self.scores_mock.return_value = pd.DataFrame([{"score_date": date(2026, 11, 2), "final_training_score": score}])
                response = self.request()
                self.assertEqual(response.status_code, 200, response.text)
                data = response.json()
                self.assertEqual(data["workout_adjustment"], factor)
                if factor == 0:
                    self.assertEqual(data["recommendations"], [])
                    self.assertIn("Skip", data["message"])
                else:
                    exercise = data["recommendations"][0]
                    self.assertEqual(sum(exercise["reps_by_set"]), total)
                    self.assertEqual((exercise["original_sets"], exercise["original_reps"]), (3, 8))
                    self.assertEqual(exercise["rest_seconds"], 120)

    def test_old_score_does_not_adjust_today(self):
        self.scores_mock.return_value = pd.DataFrame([{"score_date": date(2026, 11, 1), "final_training_score": 0}])
        data = self.request().json()
        self.assertIsNone(data["final_training_score"])
        self.assertEqual(data["workout_adjustment"], 1)
        self.assertEqual(data["recommendations"][0]["total_reps"], 24)

    def test_imported_muscle_areas_are_accepted_by_daily_entry_schema(self):
        import uuid
        from app.schema import DailyEntryCreate
        for category, muscle in [("upper_body", "forearms"), ("upper_body", "neck"), ("cardio_core", "cardio")]:
            entry = DailyEntryCreate(user_id=uuid.uuid4(), entry_date=date(2026, 11, 2),
                                     sleep=8, energy_level=5, soreness=5, stress=5,
                                     heart_rate=70, duration=20, difficulty=5,
                                     muscle_category=category, muscle_group=muscle, exercise_name="Completed exercise")
            self.assertEqual(entry.muscle_group.value, muscle)

    def test_legacy_goal_spelling(self):
        column_type = GoalEnumType(GoalEnum, native_enum=False)
        self.assertEqual(column_type._object_value_for_elem("HYPERTROPY"), GoalEnum.HYPERTROPHY)
        self.assertEqual(column_type._db_value_for_elem(GoalEnum.HYPERTROPHY), "HYPERTROPHY")

    def test_swagger_and_auth(self):
        schema = self.client.get("/openapi.json").json()
        self.assertIn("/analytics/exercise-recommendation", schema["paths"])
        del app.dependency_overrides[get_current_user]
        self.assertEqual(self.client.get("/analytics/exercise-recommendation").status_code, 401)

    def test_saved_split_equipment_and_gif(self):
        response = self.request()
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual([ex["id"] for ex in data["recommendations"]], ["curl"])
        self.assertEqual(data["recommendations"][0]["gif_url"], "https://example.com/curl.gif")
        self.assertEqual(data["recommendations"][0]["rest_seconds"], 120)

    def test_filters_override_saved_split_and_aliases(self):
        response = self.request(focus="lower_body", goal="endurance")
        self.assertEqual([ex["id"] for ex in response.json()["recommendations"]], ["squat"])
        self.assertEqual(response.json()["recommendations"][0]["reps"], 15)
        response = self.request(focus="upper_body", equipment="resistance_bands")
        self.assertEqual([ex["id"] for ex in response.json()["recommendations"]], ["press"])

    def test_goal_changes_exercise_ranking_with_same_focus_and_equipment(self):
        # More than the three-per-muscle limit makes goal ranking change membership.
        catalog = [dict(CATALOG[0], exerciseId=f"curl-{i}", name=f"Dumbbell curl {i}") for i in range(4)]
        catalog += [dict(CATALOG[0], exerciseId=f"pull-{i}", name=f"Bodyweight pull-up {i}",
                         equipments=["body weight"]) for i in range(4)]
        self.http_mock.return_value.__aenter__.return_value.get.return_value = httpx.Response(
            200, json=catalog, request=httpx.Request("GET", "https://example.com"))
        strength = self.request(goal="hypertrophy", focus="upper_body").json()["recommendations"]
        endurance = self.request(goal="endurance", focus="upper_body").json()["recommendations"]
        general = self.request(goal="healthy_lifestyle", focus="upper_body").json()["recommendations"]
        self.assertTrue(all(ex["id"].startswith("curl-") for ex in strength))
        self.assertTrue(all(ex["id"].startswith("pull-") for ex in endurance))
        self.assertNotEqual({ex["id"] for ex in strength}, {ex["id"] for ex in endurance})
        self.assertEqual((general[0]["sets"], general[0]["reps"]), (2, 10))

    def test_focus_areas_produce_distinct_muscle_targets(self):
        catalog = CATALOG + [dict(CATALOG[1], exerciseId="crunch", name="Crunch",
                                  targetMuscles=["abs"], bodyParts=["waist"])]
        self.http_mock.return_value.__aenter__.return_value.get.return_value = httpx.Response(
            200, json=catalog, request=httpx.Request("GET", "https://example.com"))
        upper = self.request(focus="upper_body").json()["recommendations"]
        lower = self.request(focus="lower_body").json()["recommendations"]
        core = self.request(focus="cardio_core").json()["recommendations"]
        self.assertEqual([ex["id"] for ex in upper], ["curl"])
        self.assertEqual([ex["id"] for ex in lower], ["squat"])
        self.assertEqual([ex["id"] for ex in core], ["crunch"])

    def test_recent_workout_blocks_recovering_muscles(self):
        self.entries_mock.return_value = pd.DataFrame([{"entry_date": date(2026, 11, 1),
                                                       "exercise_name": "Dumbbell curl", "muscle_group": "biceps"}])
        self.assertEqual(self.request().json()["recommendations"], [])
        # At 48 hours the muscle is available again.
        self.entries_mock.return_value.loc[0, "entry_date"] = date(2026, 10, 31)
        self.assertEqual(len(self.request().json()["recommendations"]), 1)

    def test_rest_day_and_no_equipment(self):
        self.fitness.weekly_split = {"monday": []}
        response = self.request()
        self.assertIn("rest day", response.json()["message"])
        self.assertEqual(self.request(equipment="").json()["recommendations"], [])
        self.http_mock.assert_not_called()

    def test_provider_failure_is_visible(self):
        self.http_mock.return_value.__aenter__.return_value.get.return_value = httpx.Response(
            404, request=httpx.Request("GET", "https://example.com"))
        response = self.request()
        self.assertEqual(response.status_code, 502)
        self.assertIn("catalog unavailable", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
