from uuid import UUID
from typing import Any

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_sources import DataSource
from app.query_engine.ast.query import Query
from app.query_engine.defination.query import QueryDefinition
from app.query_engine.result.models import QueryResult
from app.query_engine.validation.context import ColumnMetadata, ValidationContext
from app.query_engine.defination.builder import QueryDefinitionBuilder
from app.query_engine.query_builder import QueryBuilder
from app.repositories.datasources.data_source import DataSourceRepository
from app.services.datasources.secret_service import SecretService


class QueryService:

    def __init__(
        self,
        db: AsyncSession,
        query_definition_builder: QueryDefinitionBuilder | None = None,
    ):
        self.db = db
        self.query_definition_builder = query_definition_builder or QueryDefinitionBuilder()
        self.data_source_repository = DataSourceRepository(db)
        self.secret_service = SecretService()

    async def execute(
        self,
        query_definition: QueryDefinition,
        organization_id: UUID,
    ) -> QueryResult:
        query = self.query_definition_builder.build(query_definition)

        data_source = await self._get_data_source_or_404(
            organization_id=organization_id,
            data_source_id=query.datasource_id,
        )
        if not data_source.credential_secret_id:
            raise HTTPException(
                status_code=400,
                detail="Data source does not have credentials configured",
            )

        try:
            credentials = self.secret_service.get_secret(data_source.credential_secret_id)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Failed to read credentials from Secret Manager for "
                    f"{data_source.credential_secret_id}: {exc}"
                ),
            ) from exc

        if not isinstance(credentials, dict) or not credentials:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Data source credentials are empty or invalid. "
                    f"Secret: {data_source.credential_secret_id}"
                ),
            )

        try:
            engine = QueryBuilder.build(data_source=data_source, credentials=credentials)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data source credentials or configuration: {exc}",
            ) from exc

        validation_context = await engine.build_validation_context(
            query=query,
            data_source=data_source,
        )

        errors = engine.validator.validate(
            query,
            validation_context,
        )

        if errors:
            raise ValueError(errors)

        sql = engine.compiler.compile(query)

        raw_result = await engine.executor.execute(
            sql
        )

        return engine.normalizer.normalize(
            raw_result
        )

    async def _get_data_source_or_404(self, organization_id: UUID, data_source_id: UUID) -> DataSource:
        data_source = await self.data_source_repository.get_by_id(
            organization_id=organization_id,
            data_source_id=data_source_id,
        )
        if data_source is None:
            raise HTTPException(
                status_code=404,
                detail="Data source not found",
            )
        return data_source
