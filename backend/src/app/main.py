import uvicorn

from fastapi import FastAPI

app = FastAPI()


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