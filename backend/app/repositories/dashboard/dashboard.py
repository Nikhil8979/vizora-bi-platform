from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dashboard import Dashboard      

class DashboardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_dashboard(self, dashboard):
        self.db.add(dashboard)
        await self.db.commit()
        await self.db.refresh(dashboard)
        return dashboard

    async def get_dashboards(self, organization_id, limit, offset):
        result = await self.db.execute(
                    select(Dashboard)
                    .where(Dashboard.organization_id == organization_id)
                    .offset(offset)
                    .limit(limit)
                )
        return result.scalars().all()

    async def get_dashboard_by_id(self, dashboard_id, organization_id):
        result = await self.db.execute(
            select(Dashboard)
            .where(Dashboard.id == dashboard_id)
            .where(Dashboard.organization_id == organization_id)
        )
        return result.scalar_one_or_none()

    async def update_dashboard(self, dashboard):
        self.db.add(dashboard)
        await self.db.commit()
        await self.db.refresh(dashboard)
        return dashboard

    async def delete_dashboard(self, dashboard):
        await self.db.delete(dashboard)
        await self.db.commit()