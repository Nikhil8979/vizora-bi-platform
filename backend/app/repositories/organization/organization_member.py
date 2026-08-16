from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization_members import OrganizationMembers


class OrganizationMemberRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        member: OrganizationMembers,
    ) -> OrganizationMembers:

        self.db.add(member)

        await self.db.flush()

        return member