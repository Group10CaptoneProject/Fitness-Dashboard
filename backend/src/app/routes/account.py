import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import Base, get_db, User
from ..security import get_current_user

logger = logging.getLogger(__name__)

#account deletion lives in this file so profile.py can stay exactly as it is
router = APIRouter(
    prefix="/profile",
    tags=["account"],
)


#every table that stores data for a user (any table with a user_id column), children before parents
def _user_data_tables():
    return [
        table
        for table in reversed(Base.metadata.sorted_tables)
        if table is not User.__table__ and "user_id" in table.c.keys()
    ]


#delete the logged in user's account and everything saved under it
@router.delete("/account")
async def delete_account(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current_user.user_id
    users_table = User.__table__
    data_tables = _user_data_tables()
    deleted = {}

    try:
        #delete the user's data first, then the user itself
        for table in data_tables:
            result = await db.execute(table.delete().where(table.c.user_id == user_id))
            deleted[table.name] = result.rowcount

        result = await db.execute(users_table.delete().where(users_table.c.user_id == user_id))
        deleted[users_table.name] = result.rowcount

        #make sure the user is gone and nothing is left before saving the deletion
        remaining = 0
        for table in [*data_tables, users_table]:
            remaining += await db.scalar(select(func.count()).select_from(table).where(table.c.user_id == user_id))

        if deleted[users_table.name] != 1 or remaining:
            raise RuntimeError(f"Account was not fully deleted (deleted={deleted}, remaining={remaining})")

        await db.commit()
    except Exception:
        #nothing is deleted unless everything is deleted
        await db.rollback()
        logger.exception("Could not delete account for user %s", user_id)
        raise HTTPException(status_code=500, detail="Could not delete your account.")

    logger.info("Deleted account %s: %s", user_id, deleted)

    return {"message": "Account deleted.", "deleted": deleted}