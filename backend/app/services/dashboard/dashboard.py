from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.dashboard.dashboard import DashboardRepository
from app.core.pagination import get_pagination
from app.schemas.dashboard import CreateDashboardRequest, UpdateDashboardRequest
import uuid
from app.models.dashboard import Dashboard


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.dashboard_repository = DashboardRepository(db)

    async def create_dashboard(self, dashboard:CreateDashboardRequest,organization_id:uuid.UUID):
        dashboard = Dashboard(
            name=dashboard.name,
            description=dashboard.description,
            organization_id=organization_id
        )
        return await self.dashboard_repository.create_dashboard(dashboard)    

    async def get_dashboards(self, organization_id:uuid.UUID,page:int,limit:int):
        normalized_limit, normalized_offset = get_pagination(limit=limit, page=page)
        return await self.dashboard_repository.get_dashboards(organization_id, normalized_limit, normalized_offset)

    async def get_dashboard_by_id(self, dashboard_id:uuid.UUID, organization_id:uuid.UUID):
        dashboard = await self.dashboard_repository.get_dashboard_by_id(dashboard_id, organization_id)
        if not dashboard or dashboard.organization_id != organization_id:
            raise HTTPException(status_code=404, detail="Dashboard not found or does not belong to the organization")
        return dashboard

    async def update_dashboard(self, dashboard_id:uuid.UUID, organization_id:uuid.UUID, request:UpdateDashboardRequest):
        dashboard = await self.get_dashboard_by_id(dashboard_id, organization_id)
        if request.name is not None:
            dashboard.name = request.name
        if request.description is not None:
            dashboard.description = request.description
        return await self.dashboard_repository.update_dashboard(dashboard)

    async def delete_dashboard(self, dashboard_id:uuid.UUID, organization_id:uuid.UUID):
        dashboard = await self.get_dashboard_by_id(dashboard_id, organization_id)
        if not dashboard:
            raise HTTPException(status_code=404, detail="Dashboard not found or does not belong to the organization")
        await self.dashboard_repository.delete_dashboard(dashboard)
        return {"message": "Dashboard deleted successfully"}