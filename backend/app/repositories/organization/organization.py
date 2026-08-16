from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import uuid
from app.models.organizations import Organization
from app.models.organization_members import OrganizationMembers


class OrganizationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        organization: Organization,
    ) -> Organization:

        self.db.add(organization)

        await self.db.flush()

        return organization

    async def get_organization(self, organization_id: uuid.UUID) -> Organization | None:
        return await self.db.get(Organization, organization_id)

    async def get_organizations(self, user_id: int) -> list[Organization]:
        stmt = select(Organization).join(OrganizationMembers, OrganizationMembers.organization_id == Organization.id).where(OrganizationMembers.user_id == user_id)
        result = await self.db.scalars(stmt)
        return result.all()
