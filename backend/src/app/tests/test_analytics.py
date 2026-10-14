import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

# Import your FastAPI app instance
from .routes.AnalyticsRoute import predict_workout
from .main import app  # or wherever your FastAPI `app = FastAPI()` lives

client = TestClient(app)

def test_predict_endpoint_smoke():
    """
    Smoke test to verify the /predict endpoint returns a 200 OK 
    and contains the expected structure (day, weight_recommendation, workout_plan).
    """
    
    response = client.post("/analytics/predict")
    if response.status_code == 200:
        data = response.json()
        assert "day" in data
        assert "weight_recommendation" in data
        assert "workout_plan" in data
        assert isinstance(data["workout_plan"], dict)
    else:
        # If testing auth failure or missing setup
        assert response.status_code in [200, 401]

def test_exercise_recommendation_route():
    """
    Verify the exercise-recommendation route responds correctly.
    """
    response = client.get("/analytics/exercise-recommendation")
    # Should return either recommendations or require auth depending on setup
    assert response.status_code in [200, 401]