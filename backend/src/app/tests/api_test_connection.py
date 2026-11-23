import httpx
import asyncio
from app.config.config import settings

async def test_exercises():
    url = "https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises"

    headers = {
        "X-RapidAPI-Key": settings.EXERCISE_API_KEY,
        "X-RapidAPI-Host": "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com"
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, headers=headers)
        print("Status:", response.status_code)
        print(response.text[:3000])

asyncio.run(test_exercises())