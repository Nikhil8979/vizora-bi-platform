from pwdlib import PasswordHash
from datetime import datetime,timedelta,timezone
import jwt
from app.core.config import get_app_config
from typing import Annotated
from fastapi import Depends,HTTPException,status
from jwt.exceptions import InvalidTokenError
from fastapi.security import OAuth2PasswordBearer
from app.schemas.auth import TokenData
config = get_app_config()
password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def hash_password(password:str)->str:
    return password_hash.hash(password)

def verify_password(plain_password, hashed_password)->bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=config.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.secret_key, algorithm=config.algorithm)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, config.secret_key, algorithms=[config.algorithm])
        username = payload.get("email")
        name = payload.get("name")
        id = payload.get("id")
        if username is None:
            raise credentials_exception
        token_data = TokenData(email=username,id=id,name=name)
        return token_data
    except InvalidTokenError:
        raise credentials_exception