from dataclasses import dataclass

from fastapi import HTTPException

from app.query_engine.compiler.query import SQLCompiler as QueryCompiler
from app.query_engine.ast.query import Query
from app.query_engine.executor.base import BaseQueryExecutor
from app.models.data_sources import DataSource
from app.query_engine.result.normalizer import ResultNormalizer
from app.query_engine.validation.context import ColumnMetadata, ValidationContext
from app.query_engine.validation.query_validator import QueryValidator


@dataclass
class QueryEngine:

    validator: QueryValidator
    compiler: QueryCompiler
    executor: BaseQueryExecutor
    normalizer: ResultNormalizer

    async def build_validation_context(
        self,
        query: Query,
        data_source: DataSource,
    ) -> ValidationContext:
        adapter = getattr(self.executor, "adapter", None)
        if adapter is None:
            raise HTTPException(
                status_code=500,
                detail="Query executor does not expose a data source adapter",
            )

        namespace = query.table.schema or data_source.configuration.get("dataset")
        if not namespace:
            raise HTTPException(
                status_code=400,
                detail="Table schema is required to validate query columns",
            )

        fields = await adapter.get_fields(
            namespace=namespace,
            collection=query.table.name,
        )

        columns = {
            field["name"]: ColumnMetadata(
                name=field["name"],
                data_type=field.get("data_type", "unknown"),
            )
            for field in fields
            if isinstance(field, dict) and "name" in field
        }
        return ValidationContext(columns=columns)
