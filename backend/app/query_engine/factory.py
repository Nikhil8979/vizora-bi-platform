from app.query_engine.compiler.bigquery import BigQueryCompiler
from app.query_engine.compiler.query import SQLCompiler as QueryCompiler
from app.query_engine.executor.base import BaseQueryExecutor
from app.query_engine.executor.bigquery import BigQueryExecutor
from app.models.data_sources import DataSourceType


class QueryEngineFactory:

    def create_compiler(
        self,
        datasource_type: DataSourceType,
    ) -> QueryCompiler:

        if datasource_type == DataSourceType.BIGQUERY:
            return BigQueryCompiler()

        raise ValueError(
            f"Unsupported data source type: "
            f"{datasource_type}"
        )

    def create_executor(
        self,
        datasource_type: DataSourceType,
        adapter,
    ) -> BaseQueryExecutor:

        if datasource_type == DataSourceType.BIGQUERY:
            return BigQueryExecutor(adapter)

        raise ValueError(
            f"Unsupported data source type: "
            f"{datasource_type}"
        )
