from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.deps import get_db
from app.repositories.auth import AuthRepository
from app.schemas.auth import LoginRequest, RegisterRequest, RegisterResponse, Token
from app.services.auth.auth import AuthService
from app.utils.responses import api_success

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_repository(db: AsyncSession = Depends(get_db)) -> AuthRepository:
    return AuthRepository(db)

def get_auth_service(repository: AuthRepository = Depends(get_auth_repository)) -> AuthService:
    return AuthService(repository)


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(
    data: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: AuthService = Depends(get_auth_service),
):
    data = LoginRequest(email=data.username, password=data.password)
    result = await service.login(data)
    return Token(access_token=result.access_token, token_type=result.token_type)


@router.post("/register", status_code=status.HTTP_200_OK)
async def register(
    data: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    result = await service.register(data)
    return api_success(
        data=RegisterResponse.model_validate(result),
        message="User created successfully",
        code=status.HTTP_200_OK,
    )
    