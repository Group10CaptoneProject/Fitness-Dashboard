import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
import uuid

from app.config.config import settings

# JWT token generation 
EXPIRE_MINUTES = 60

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

#Protected route dependency function 
async def get_current_user():
    pass