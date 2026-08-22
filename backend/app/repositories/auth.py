from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization_members import OrganizationMembers
from app.models.organizations import Organization
from app.models.user import User


class AuthRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return await self.db.scalar(stmt)

    async def create_user(self, name: str, email: str, hashed_password: str) -> User:
        user = User(name=name, email=email, password=hashed_password)
        self.db.add(user)
        await self.db.flush()
        return user

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def get_user_by_id(self, user_id: int) -> User | None:
        stmt = select(User).where(User.id == user_id)
        return await self.db.scalar(stmt)

    async def get_user_organizations(self, user_id: int) -> list[Organization]:
        stmt = (
            select(Organization)
            .join(OrganizationMembers, OrganizationMembers.organization_id == Organization.id)
            .where(OrganizationMembers.user_id == user_id)
        )
        result = await self.db.scalars(stmt)
        return list(result.all())