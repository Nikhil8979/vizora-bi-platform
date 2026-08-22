from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_sources import  DataSource, DataSourceType


class DataSourceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        organization_id: UUID,
        user_id: int,
        name: str,
        data_source_type: DataSourceType,
        configuration: dict,
    ) -> DataSource:

        data_source = DataSource(
            organization_id=organization_id,
            created_by=user_id,
            name=name,
            type=data_source_type,
            configuration=configuration,
        )

        self.db.add(data_source)
        await self.db.flush()
        await self.db.refresh(data_source)

        return data_source

    async def get_all(
        self,
        organization_id: UUID,
    ) -> list[DataSource]:

        result = await self.db.execute(
            select(DataSource)
            .where(
                DataSource.organization_id == organization_id
            )
            .order_by(DataSource.created_at.desc())
        )

        return list(result.scalars().all())

    async def get_by_id(
        self,
        organization_id: UUID,
        data_source_id: UUID,
    ) -> DataSource | None:

        result = await self.db.execute(
            select(DataSource)
            .where(
                DataSource.id == data_source_id,
                DataSource.organization_id == organization_id,
            )
        )

        return result.scalar_one_or_none()

    async def update_credential_secret(
        self,
        organization_id: UUID,
        data_source_id: UUID,
        credential_secret_id: str,
    ) -> DataSource | None:

        data_source = await self.get_by_id(
            organization_id=organization_id,
            data_source_id=data_source_id,
        )

        if not data_source:
            return None

        data_source.credential_secret_id = credential_secret_id
        await self.db.flush()
        await self.db.refresh(data_source)

        return data_source

    async def delete(
        self,
        organization_id: UUID,
        data_source_id: UUID,
    ) -> bool:

        data_source = await self.get_by_id(
            organization_id=organization_id,
            data_source_id=data_source_id,
        )

        if not data_source:
            return False

        await self.db.delete(data_source)
        await self.db.flush()

        return True