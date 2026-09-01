from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from uuid import UUID
from fastapi import HTTPException
from app.models.data_sources import DataSource
from app.schemas.data_source import CreateDataSourceRequest as DataSourceCreate
from app.repositories.datasources.data_source import DataSourceRepository
from app.services.datasources.secret_service import SecretService
from app.adapters.datasource_adapter_factory import DataSourceAdapterFactory

class DataSourceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.data_source_repository = DataSourceRepository(db)
        self.secret_service = SecretService()

    async def create_data_source(self, data_source: DataSourceCreate, organization_id: UUID, user_id: int) -> DataSource:
        created_secret_name: str | None = None
        try:
            new_data_source = await self.data_source_repository.create(
                organization_id=organization_id,
                user_id=user_id,
                name=data_source.name,
                description=data_source.description,
                data_source_type=data_source.type,
                configuration=self._dump_payload(data_source.configuration),
            )

            secret_id = f"data_source_{new_data_source.id}"

            created_secret_name = await self.secret_service.create_secret(
                secret_id=secret_id,
                credentials=self._dump_payload(data_source.credentials),
            )
            updated_data_source = await self.data_source_repository.update_credential_secret(
                organization_id=organization_id,
                data_source_id=new_data_source.id,
                credential_secret_id=created_secret_name,
            )

            if updated_data_source is None:
                raise HTTPException(
                    status_code=404,
                    detail="Data source not found",
                )

            await self.db.commit()
            return updated_data_source
        except Exception:
            await self.db.rollback()
            if created_secret_name:
                await self.secret_service.delete_secret(created_secret_name)
            raise

    async def get_data_sources(self, organization_id: UUID) -> list[DataSource]:
        return await self.data_source_repository.get_all(organization_id=organization_id)   

    async def get_data_source_by_id(self, organization_id: UUID, data_source_id: UUID) -> DataSource:
        return await self._get_data_source_or_404(
            organization_id=organization_id,
            data_source_id=data_source_id,
        )

    async def delete_data_source(self, organization_id: UUID, data_source_id: UUID) -> None:
        data_source = await self._get_data_source_or_404(organization_id, data_source_id)

        if data_source.credential_secret_id:
            await self.secret_service.delete_secret(data_source.credential_secret_id)

        await self.data_source_repository.delete(organization_id=organization_id, data_source_id=data_source_id)
        await self.db.commit()

    async def test_data_source_connection(self, organization_id: UUID, data_source_id: UUID) -> dict:
        adapter = await self._get_adapter(organization_id, data_source_id)
        return await adapter.test_connection()

    async def get_data_source_namespaces(self, organization_id: UUID, data_source_id: UUID) -> list[dict]:
        adapter = await self._get_adapter(organization_id, data_source_id)
        return await adapter.get_namespaces()

    async def get_data_source_collections(
        self,
        organization_id: UUID,
        data_source_id: UUID,
        namespace_name: str,
    ) -> list[dict]:
        adapter = await self._get_adapter(organization_id, data_source_id)
        return await adapter.get_collections(namespace=namespace_name)

    async def get_data_source_fields(
        self,
        organization_id: UUID,
        data_source_id: UUID,
        namespace_name: str,
        collection_name: str,
    ) -> list[dict]:
        adapter = await self._get_adapter(organization_id, data_source_id)
        return await adapter.get_fields(namespace=namespace_name, collection=collection_name)

    async def get_data_source_schema(self, organization_id: UUID, data_source_id: UUID) -> list[dict]:
        return await self.get_data_source_namespaces(organization_id, data_source_id)

    async def get_data_source_tables(self, organization_id: UUID, data_source_id: UUID, schema_name: str) -> list[dict]:
        return await self.get_data_source_collections(organization_id, data_source_id, schema_name)

    async def get_data_source_table_columns(self, organization_id: UUID, data_source_id: UUID, schema_name: str, table_name: str) -> list[dict]:
        return await self.get_data_source_fields(organization_id, data_source_id, schema_name, table_name)

    async def _get_data_source_or_404(self, organization_id: UUID, data_source_id: UUID) -> DataSource:
        data_source = await self.data_source_repository.get_by_id(
            organization_id=organization_id,
            data_source_id=data_source_id,
        )
        if not data_source:
            raise HTTPException(
                status_code=404,
                detail="Data source not found",
            )
        return data_source

    async def _get_adapter(self, organization_id: UUID, data_source_id: UUID):
        data_source = await self._get_data_source_or_404(organization_id, data_source_id)
        if not data_source.credential_secret_id:
            raise HTTPException(
                status_code=400,
                detail="Data source does not have credentials configured",
            )

        credentials = self.secret_service.get_secret(data_source.credential_secret_id)
        try:
            return DataSourceAdapterFactory.create(
                data_source=data_source,
                credentials=credentials,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @staticmethod
    def _dump_payload(value: BaseModel | dict | None) -> dict:
        if value is None:
            return {}
        if isinstance(value, BaseModel):
            return value.model_dump(mode="json")
        return value