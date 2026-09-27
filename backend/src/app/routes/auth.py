from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pwdlib import PasswordHash
import secrets
from datetime import datetime, timedelta, timezone

from app.schemas.auth import LoginUser, RegisterUser, ForgotPassword, VerifyResetCode , ResetPassword
from app.db import User, PasswordResetCode, get_db
from app.security import create_token, create_reset_token, verify_reset_token, verify_token
from app.services.email import send_mail

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
        if data.password != data.confirm_password:
             raise HTTPException(status_code=400,detail="Passwords do not match")
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
    

@router.post("/login")
async def login(data: LoginUser, db: AsyncSession = Depends(get_db)):
    # Check if the user exists in the database
    user_query = await db.execute(
         select(User).where(User.email == data.email)
    )
    user = user_query.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify the password
    correct_password = password_hasher.verify(data.password,user.password_hash)

    if not correct_password:
         raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.user_id)

    return{
        "message": "User logged in successfully",
        "username": user.username,
        "user_id": user.user_id,
        "access_token": token,
        "token_type": "bearer"
    }

# Routes for resetting forgot password 
# /forgot_password -> /verify-reset-code -> /reset-password

@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: AsyncSession = Depends(get_db)):
    email_verify = await db.execute(
        select(User).where(User.email == data.email)
    )
    user = email_verify.scalar_one_or_none()
    if user is None:
         raise HTTPException(status_code=404, detail ="User not found")
    
    code = f"{secrets.randbelow(1000000):06d}"
    code_hash = password_hasher.hash(code)
    expiration_time = (
         datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    reset_code = PasswordResetCode(
         user_id = user.user_id,
         code_hash = code_hash,
         expires_at = expiration_time
    )

    db.add(reset_code)
    await db.commit()

    #Send the code to user email
    await send_mail(user.email, code)

    return {
         "message" : "Verification code sent"
    }

@router.post("/verify-reset-code")
async def verify_code(data: VerifyResetCode, db: AsyncSession = Depends(get_db)):
    email_verify = await db.execute(
        select(User).where(User.email == data.email)
    )
    user = email_verify.scalar_one_or_none()
    if user is None:
         raise HTTPException(status_code=400, detail="Invalid verification code")
    #Find latest entry of reset password request
    reset_query = await db.execute(
         select(PasswordResetCode).where(PasswordResetCode.user_id == user.user_id, PasswordResetCode.used.is_(False))
         .order_by(PasswordResetCode.created_at.desc())
    )
    reset_code = reset_query.scalars().first()
    if reset_code is None:
         raise HTTPException(status_code=400,detail="Invalid verification code")
    #Compare expire time, which is 10 minute from the time the code is given
    if datetime.now(timezone.utc) > reset_code.expires_at:
            raise HTTPException(status_code=400,detail="Code expired")
    if not password_hasher.verify(data.code, reset_code.code_hash):
         raise HTTPException(status_code=400,detail="Invalid verification code")

    reset_code.used = True

    #Main logic is using this reset token get access to reset password route
    reset_token = create_reset_token(user.user_id)
    await db.commit()

    return{
        "message":"Verification successful",
        "reset_token": reset_token
    }
     
@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400,detail="Passwords do not match")
    user_id = verify_reset_token(data.reset_token)

    # Find user
    user_query = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = user_query.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404,detail="User not found")
    new_password_hash = password_hasher.hash(
        data.new_password
    )
    user.password_hash = new_password_hash
    await db.commit()

    return {
        "message": "Password reset successfully"
    }

     
    