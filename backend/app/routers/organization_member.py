from fastapi import APIRouter, Depends
from typing_extensions import Annotated

from app.schemas.organization_member import InviteMemberRequest, InviteMemberResponse, OrganizationMemberResponse
from app.dependencies import CurrentOrganization, DbSession,CurrentUser
from app.services.organizations.organization_members import OrganizationMemberService
from app.core.pagination import PaginationParams, pagination_params
from app.utils.responses import api_success

router = APIRouter(prefix="/organizations",tags=["Organization Members"])

def get_organization_member_service(db: DbSession) -> OrganizationMemberService:
    return OrganizationMemberService(db=db)

OrganizationMemberServiceDeps = Annotated[OrganizationMemberService, Depends(get_organization_member_service)]
@router.post("/{organization_id}/members/invite")
async def invite_member(request: InviteMemberRequest, current_organization: CurrentOrganization,service: OrganizationMemberServiceDeps,current_user:CurrentUser):
  
    member = await service.invite_member(current_organization.id, request, current_user.id)
    return api_success(
        data=InviteMemberResponse.model_validate(member),
        message="Member invited successfully",
        code=200,
    )

@router.get("/{organization_id}/members")
async def get_organization_members(
    current_organization: CurrentOrganization,
    service: OrganizationMemberServiceDeps,
    pagination: Annotated[PaginationParams, Depends(pagination_params)],
):
    members = await service.get_organization_members(
        current_organization.id,
        limit=pagination.limit,
        page=pagination.page,
    )
    return api_success(
        data=[OrganizationMemberResponse.model_validate(member) for member in members],
        message="Organization members retrieved successfully",
        code=200,
    )
