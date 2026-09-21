from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn

from app.db import test_connection, init_db
@asynccontextmanager
async def lifespan(app: FastAPI):
    await test_connection() #run when loading fast api
    yield   #run after loading fast api

app = FastAPI(lifespan=lifespan)

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