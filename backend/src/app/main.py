from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

from .db import test_connection, init_db
from .routes.auth import router as auth_router 

@asynccontextmanager
async def lifespan(app: FastAPI):
    await test_connection() #run when loading fast api
    yield   #run after loading fast api

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#auth router
app.include_router(auth_router)

@app.get("/")
async def home():
    return {"message": "Hello home"}


def start():
    uvicorn.run(
        "app.main:app",
        host="localhost",
        port=8888,
        reload=True
    )