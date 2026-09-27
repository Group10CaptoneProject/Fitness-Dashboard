import jwt
from datetime import datetime, timedelta, timezone

from app.config import settings

EXPIRE_MINUTES = 60

def create_token(user_id):
    expiration_time = (datetime.now(timezone.utc)+ timedelta(minutes=EXPIRE_MINUTES))
    payload = {"sub": str(user_id), "exp": expiration_time}
    token = jwt.encode(payload,settings.jwt_secret_key, algorithm="HS256")

    return token
