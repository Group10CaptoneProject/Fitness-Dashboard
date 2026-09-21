from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pwdlib import PasswordHash

from app.schemas.auth import LoginUser, RegisterUser
from app.db import User, get_db

router = APIRouter(prefix="/auth", tags=["auth"])

password_hasher = PasswordHash.recommended()

@router.post("/register")
async def register(data: RegisterUser, db: AsyncSession = Depends(get_db)):
     # Check if the user exists in the database
        username_verify = await db.execute(
            select(User).where(User.username == data.username)
        )
        if username_verify.scalar_one_or_none() is not None:
            raise HTTPException(status_code = 400, detail ="Username already exists")
        email_verify = await db.execute(
            select(User).where(User.email == data.email)
        )
        if email_verify.scalar_one_or_none() is not None:
            raise HTTPException(status_code = 400, detail ="Email already exists")

        # Hash their password
        hashed_password = password_hasher.hash(data.password)

        # Creates the user
        new_user = User(
            username = data.username,
            email = data.email,
            first_name = data.first_name,
            last_name = data.last_name,
            password_hash = hashed_password
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
    
        return{
            "message": "User registered successfully",
            "username": new_user.username,
            "user_id": new_user.user_id
        }
    

@router.get("/login")
async def login(data: LoginUser, db: AsyncSession = Depends(get_db)):
    # Check if the user exists in the database
    user_query = await db.execute(
         select(User).where(User.email == data.email)
    )
    if user_query.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="User not found")
    

@router.post("/forgot-password")
async def forgot_password():
    pass