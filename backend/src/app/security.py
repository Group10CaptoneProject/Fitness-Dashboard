import jwt
from datetime import datetime, timedelta, timezone
import uuid
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException
from app.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession


from app.config.config import settings

# JWT token generation 
EXPIRE_MINUTES = 60
RESET_TOKEN_EXPIRE_MINUTES = 10

def create_token(user_id):
    expiration_time = (datetime.now(timezone.utc)+ timedelta(minutes=EXPIRE_MINUTES))
    payload = {"sub": str(user_id), "exp": expiration_time}
    token = jwt.encode(payload,settings.jwt_secret_key, algorithm="HS256")

    return token

#Verify JWT token helper function for dependency function
def verify_token(token: str):
    try: 
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code = 401, detail = "Invaild token")
        return uuid.UUID(user_id)
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code = 401, detail= "Expired token")
    
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code = 401, detail= "Invalid token")

def create_reset_token(user_id):
    expiration_time = (datetime.now(timezone.utc)+ timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": str(user_id), "purpose": "password_reset", "exp": expiration_time}
    token = jwt.encode(payload,settings.jwt_secret_key, algorithm="HS256")
    
    return token
def verify_reset_token(token: str):
    try: 
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        if payload.get("purpose") != "password_reset":
            raise HTTPException(status_code = 401, detail = "Invaild reset token")
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code = 401, detail = "Invaild reset token")
        return uuid.UUID(user_id)
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code = 401, detail= "Expired reset token")
    
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code = 401, detail= "Invalid reset token")
    
#Protected route dependency function 
security = HTTPBearer()
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials

    user_id = verify_token(token)

    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user