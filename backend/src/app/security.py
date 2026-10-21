
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.config import settings
from app.db import User, get_db


# JWT token configuration
EXPIRE_MINUTES = 60
RESET_TOKEN_EXPIRE_MINUTES = 10


# Generate an authentication token
def create_token(user_id):
    expiration_time = datetime.now(timezone.utc) + timedelta(
        minutes=EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expiration_time,
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm="HS256",
    )

    return token


# Verify an authentication token
def verify_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

        return uuid.UUID(user_id)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Expired token",
        )

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )


# Generate a password-reset token
def create_reset_token(user_id):
    expiration_time = datetime.now(timezone.utc) + timedelta(
        minutes=RESET_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "purpose": "password_reset",
        "exp": expiration_time,
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm="HS256",
    )

    return token


# Verify a password-reset token
def verify_reset_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
        )

        if payload.get("purpose") != "password_reset":
            raise HTTPException(
                status_code=401,
                detail="Invalid reset token",
            )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid reset token",
            )

        return uuid.UUID(user_id)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Expired reset token",
        )

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid reset token",
        )


# OAuth2 authentication configuration
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# Dependency for protected routes
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    # Decode the token to obtain the user ID
    user_id = verify_token(token)

    # Find the corresponding user in the database
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )

    user = result.scalar_one_or_none()

    # Reject requests if the user no longer exists
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user
