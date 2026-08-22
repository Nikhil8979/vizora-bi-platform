from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
import uuid
from app.repositories.organization.organization import OrganizationRepository
class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.organization_repository = OrganizationRepository(db)

    async def get_organization(self, organization_id: uuid.UUID):
        organization = await self.organization_repository.get_organization(organization_id)
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
        return organization

    async def get_organizations(self, user_id: int):
        organizations = await self.organization_repository.get_organizations(user_id)
        return organizations