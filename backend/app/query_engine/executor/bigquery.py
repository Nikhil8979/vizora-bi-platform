from typing import Any

from app.query_engine.executor.base import BaseQueryExecutor
from app.adapters.bigquery import BigQueryAdapter
class BigQueryExecutor(BaseQueryExecutor):
    def __init__(self, adapter: BigQueryAdapter):
        self.adapter = adapter

    async def execute(
        self,
        sql: str,
    ) -> Any:
        """
        Execute compiled SQL against BigQuery.
        """
        return await self.adapter.execute_query(sql)