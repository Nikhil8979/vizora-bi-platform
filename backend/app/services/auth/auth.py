from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.auth import AuthRepository
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from app.repositories.organization.organization_member import OrganizationMemberRepository
from app.repositories.organization.organization import OrganizationRepository

from app.models.user import User
from app.models.organizations import Organization
from app.models.organization_members import OrganizationMembers
class AuthService:
    def __init__(self, repository: AuthRepository,
                 organization_repository: OrganizationRepository,
                 organization_member_repository: OrganizationMemberRepository,):
        self.repository = repository
        self.organization_repository = organization_repository
        self.organization_member_repository = organization_member_repository
        self.db = repository.db
    
    async def login(self, data: LoginRequest) -> LoginResponse:
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
        organizations = await self.repository.get_user_organizations(user.id)
        return LoginResponse(
            user=user,
            organizations=organizations,
            access_token=token,
            token_type="bearer",
        )

    async def register(self, data: RegisterRequest):
        existing_user = await self.repository.get_user_by_email(
            data.email.lower()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User with this email already exists",
            )

        try:
            user = await self.repository.create_user(
                name=data.full_name,
                email=data.email.lower(),
                hashed_password=hash_password(data.password),
            )

            organization = await self.organization_repository.create(
                Organization(
                    name=data.organization_name,
                    slug=data.organization_name.lower().replace(" ", "-"),
                )
            )

            membership = await self.organization_member_repository.create(
                OrganizationMembers(
                    user_id=user.id,
                    organization_id=organization.id,
                    role="OWNER",
                )
            )

            await self.repository.commit()
        except IntegrityError as exc:
            await self.repository.rollback()
            raise HTTPException(
                status_code=409,
                detail="User or organization already exists",
            ) from exc
        except Exception:
            await self.repository.rollback()
            raise

        payload = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }
        token = create_access_token(payload)

        return {
            "user": user,
            "organization": organization,
            "role": membership.role,
            "access_token": token,
            "token_type": "bearer",
        }

    async def get_current_user(self, user_id: int):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user