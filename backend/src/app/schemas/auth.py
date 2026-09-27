from pydantic import BaseModel , EmailStr, Field
import uuid
from datetime import datetime, date, timezone 

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, AsyncSession, async_sessionmaker

from ..db import PasswordResetCode, async_session_maker

class RegisterUser(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr = Field(max_length=100)
    first_name: str = Field(min_length = 1, max_length=50)
    last_name: str = Field(min_length = 1, max_length=50)
    password: str = Field(min_length=6, max_length=255)
    confirm_password: str = Field(min_length=6, max_length=255) 

class LoginUser(BaseModel):
    email: EmailStr = Field(max_length=100)
    password: str = Field(min_length=6, max_length=255)

class ForgotPassword(BaseModel):
    email: EmailStr = Field(max_length=100)

class VerifyResetCode(BaseModel):
    email: EmailStr
    code: str

class ResetPassword(BaseModel):
    reset_token: str
    new_password: str
    confirm_password: str

#creat password reset code
async def create_password_reset_code(user_id: uuid.UUID, code_hash: str, expires_at: datetime):
    #create session 
    async with async_session_maker() as session:
        reset_entry = PasswordResetCode(
            user_id=user_id,
            code_hash=code_hash,
            expires_at=expires_at,
            used=False
        )
        session.add(reset_entry)
        await session.commit()

#get password reset code
async def get_password_reset_code(user_id: uuid.UUID, code_hash: str):
    async with async_session_maker() as session:
        now = datetime.now(timezone.utc)
        stmt = (
            select(PasswordResetCode)
            .where(PasswordResetCode.user_id == user_id,
                PasswordResetCode.code_hash == code_hash,
                PasswordResetCode.used == False,
                PasswordResetCode.expires_at > now
            )
        )
        result = await session.execute(stmt)
        return result.scalars().first()

#update password rest to neon environment
async def mark_code_as_used(reset_id: int):
    async with async_session_maker() as session:
        code_record = await session.get(PasswordResetCode, reset_id)
        #code to reset was used. 
        if code_record:
            code_record.used = True
            await session.commit()