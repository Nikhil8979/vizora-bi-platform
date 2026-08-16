from fastapi import HTTPException

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.auth import AuthRepository
from app.schemas.auth import LoginRequest, RegisterRequest, Token


class AuthService:
    def __init__(self, repository: AuthRepository):
        self.repository = repository
    
    async def login(self, data: LoginRequest) -> Token:
        user = await self.repository.get_user_by_email(data.email)
        if not user:
            raise HTTPException(status_code=401, detail="Email or password is incorrect")

        if not verify_password(data.password, user.password):
            raise HTTPException(status_code=401, detail="Email or password is incorrect")

        payload = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }

        token = create_access_token(payload)
        return Token(access_token=token, token_type="bearer")

    async def register(self, data: RegisterRequest):
        normalized_email = data.email.lower()
        existing = await self.repository.get_user_by_email(normalized_email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already exists")

        return await self.repository.create_user(
            name=data.full_name.strip(),
            email=normalized_email,
            hashed_password=hash_password(data.password),
        )

    async def get_current_user(self, user_id: int):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user