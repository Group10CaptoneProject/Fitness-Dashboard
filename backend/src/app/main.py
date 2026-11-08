from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .db import test_connection, init_db
from .routes.auth import router as auth_router
from .routes.profile import router as profile_router
from .routes.entries import router as entries_router
from .routes.dashboard import router as dashboard_router
<<<<<<< HEAD
=======
from .routes.AnalyticsRoute import router as predict_router
>>>>>>> c1b366746d429f7a830d11eb6889cfb2c199a96e
from .RandomForestClassifier import router as recommendation_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await test_connection()
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)

# Allow the React frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes.
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(entries_router)
app.include_router(dashboard_router)
<<<<<<< HEAD
=======
app.include_router(predict_router)
>>>>>>> c1b366746d429f7a830d11eb6889cfb2c199a96e
app.include_router(recommendation_router)


@app.get("/")
async def home():
    return {"message": "Hello home"}

def start():
    uvicorn.run(
        "app.main:app",
        host="localhost",
        port=8888,
        reload=True,
    )

if __name__ == "__main__":
    start()