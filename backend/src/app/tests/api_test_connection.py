import asyncio 
from app.RandomForestClassifier import fetch_and_cache_exercises 

async def main():
    await fetch_and_cache_exercises()

if __name__ == "__main__":
    asyncio.run(main())
