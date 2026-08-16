from typing import Annotated

from fastapi import APIRouter, Depends, status
import uuid
from app.dependencies import CurrentUser, DbSession, CurrentOrganization
from app.services.organizations.organizations import OrganizationService
from app.utils.responses import api_success
from app.schemas.organization import OrganizationResponse
router = APIRouter(prefix="/organizations", tags=["Organizations"])

def get_organization_service(db:DbSession) -> OrganizationService:
    return OrganizationService(db=db)

OrganizationServiceDeps = Annotated[OrganizationService, Depends(get_organization_service)]

@router.get("/{organization_id}", status_code=status.HTTP_200_OK)
async def get_organization(
    current_organization: CurrentOrganization,
):
    organization = current_organization
    return api_success(
        data=OrganizationResponse.model_validate(organization),
        message="Organization retrieved successfully",
        code=status.HTTP_200_OK,
    )

@router.get("/", status_code=status.HTTP_200_OK)
async def get_organizations(
    organization_service: OrganizationServiceDeps,
    current_user:CurrentUser,
):
    organizations = await organization_service.get_organizations(current_user.id)
    return api_success(
        data=[OrganizationResponse.model_validate(org) for org in organizations],
        message="Organizations retrieved successfully",
        code=status.HTTP_200_OK,
    )