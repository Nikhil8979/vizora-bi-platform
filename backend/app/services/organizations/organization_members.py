from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
import uuid
from app.repositories.organization.organization_member import OrganizationMemberRepository
from app.schemas.organization_member import InviteMemberRequest as OrganizationMemberInviteRequest
from app.repositories.user.user import UserRepository
from app.core.pagination import get_pagination


class OrganizationMemberService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.organization_member_repository = OrganizationMemberRepository(db)
        self.user_repository = UserRepository(db)

    async def invite_member(self, organization_id: uuid.UUID, data: OrganizationMemberInviteRequest, current_user_id: int): 
        role = await self.organization_member_repository.get_user_role_in_organization(organization_id, current_user_id)
        if role not in ("ADMIN", "OWNER"):
            raise HTTPException(status_code=403, detail="Only admin or owner can invite members")
        user = await self.user_repository.get_user_by_email(data.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        member_exists = await self.organization_member_repository.check_member_exists(organization_id, user.id)
        if member_exists:
            raise HTTPException(status_code=400, detail="User is already a member of the organization")
        try:
            member = await self.organization_member_repository.invite_member(
                organization_id,
                data,
                member_user_id=user.id,
            )
            await self.db.commit()
            return member
        except Exception:
            await self.db.rollback()
            raise

    async def get_organization_members(self, organization_id: uuid.UUID, limit: int | None = None, page: int = 1):
        normalized_limit, normalized_offset = get_pagination(limit=limit, page=page)
        members = await self.organization_member_repository.get_organization_members(
            organization_id,
            limit=normalized_limit,
            offset=normalized_offset,
        )
        return members

  