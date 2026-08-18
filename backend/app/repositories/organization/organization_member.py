import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.organization_member import InviteMemberRequest as OrganizationMemberInviteRequest
from app.models.organization_members import OrganizationMembers
from app.core.pagination import DEFAULT_PAGE_SIZE


class OrganizationMemberRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def invite_member(
        self,
        organization_id: uuid.UUID,
        data: OrganizationMemberInviteRequest,
        member_user_id: int,
    ) -> OrganizationMembers:
        new_member = OrganizationMembers(
            organization_id=organization_id,
            user_id=member_user_id,
            role=data.role,
        )
        self.db.add(new_member)
        await self.db.flush()
        return new_member

    async def get_user_role_in_organization(self, organization_id: uuid.UUID, user_id: int):
        result = await self.db.execute(
            select(OrganizationMembers.role).where(
                OrganizationMembers.organization_id == organization_id,
                OrganizationMembers.user_id == user_id
            )
        )
        return result.scalar_one_or_none()    

    async def check_member_exists(self, organization_id: uuid.UUID, user_id: int) -> bool:
        result = await self.db.execute(
            select(OrganizationMembers).where(
                OrganizationMembers.organization_id == organization_id,
                OrganizationMembers.user_id == user_id
            )
        )
        return result.scalar_one_or_none() is not None   
    async def get_organization_members(
        self,
        organization_id: uuid.UUID,
        limit: int = DEFAULT_PAGE_SIZE,
        offset: int = 0,
    ): 
        result = await self.db.execute(
            select(OrganizationMembers)
            .options(selectinload(OrganizationMembers.user))
            .where(OrganizationMembers.organization_id == organization_id)
            .order_by(OrganizationMembers.id)
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()
