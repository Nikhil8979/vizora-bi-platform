from fastapi import APIRouter, Depends, HTTPException
import uuid
from typing import Annotated
from app.services.dashboard.dashboard import DashboardService
from app.schemas.dashboard import CreateDashboardRequest,DashboardResponse, UpdateDashboardRequest
from app.dependencies import CurrentOrganization, DbSession
from app.utils.responses import api_success
from app.core.pagination import PaginationParams,pagination_params
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_dashboard_service(db: DbSession) -> DashboardService:
    return DashboardService(db)

DashboardServiceDeps = Annotated[DashboardService, Depends(get_dashboard_service)]

@router.post("/{organization_id}")
async def create_dashboard(
    dashboard: CreateDashboardRequest,
    current_organization: CurrentOrganization,
    service: DashboardServiceDeps,
):
    created_dashboard = await service.create_dashboard(dashboard,current_organization.id)
    return api_success(
        data=DashboardResponse.model_validate(created_dashboard),
        message="Dashboard created successfully",
        code=200,
    )

@router.get("/{organization_id}/list")
async def get_dashboards(
    current_organization: CurrentOrganization,
    pagination: Annotated[PaginationParams, Depends(pagination_params)],
    service: DashboardServiceDeps,
):
    dashboards = await service.get_dashboards(current_organization.id, pagination.page,pagination.limit)
    return api_success(
        data=[DashboardResponse.model_validate(dashboard) for dashboard in dashboards],
        message="Dashboards retrieved successfully",
        code=200,
    )


@router.get("/{organization_id}/{dashboard_id}")
async def get_dashboard(
    current_organization: CurrentOrganization,
    dashboard_id: uuid.UUID,
    service: DashboardServiceDeps,
):
    dashboard = await service.get_dashboard_by_id(dashboard_id=dashboard_id, organization_id=current_organization.id)
    return api_success(
        data=DashboardResponse.model_validate(dashboard),
        message="Dashboard retrieved successfully",
        code=200,
    )

@router.patch("/{organization_id}/{dashboard_id}")
async def update_dashboard(
    current_organization: CurrentOrganization,
    dashboard_id: uuid.UUID,
    request: UpdateDashboardRequest,
    service: DashboardServiceDeps,
):
    updated_dashboard = await service.update_dashboard(dashboard_id=dashboard_id, organization_id=current_organization.id, request=request)
    return api_success(
        data=DashboardResponse.model_validate(updated_dashboard),
        message="Dashboard updated successfully",
        code=200,
    )


@router.delete("/{organization_id}/{dashboard_id}")
async def delete_dashboard(
    current_organization: CurrentOrganization,
    dashboard_id: uuid.UUID,
    service: DashboardServiceDeps,
):
    await service.delete_dashboard(dashboard_id=dashboard_id, organization_id=current_organization.id)
    return api_success(
        data=None,
        message="Dashboard deleted successfully",
        code=200,
    )