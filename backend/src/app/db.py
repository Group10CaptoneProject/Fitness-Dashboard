import asyncio
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy import text
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import settings

database_url = make_url(settings.database_url)
database_url = database_url.set(drivername="postgresql+asyncpg")

database_url = database_url.difference_update_query(
    ["sslmode", "channel_binding"]
)

engine = create_async_engine(
    database_url,
    connect_args={"ssl": "require"},
)

# For testing the database connection
async def test_connection():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("Database connection successful")
    except Exception as e:
        print("Database connection failed:", e)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())