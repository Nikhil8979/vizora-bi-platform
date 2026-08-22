from abc import ABC, abstractmethod
from typing import Any


class DataSourceAdapter(ABC):

    @abstractmethod
    async def test_connection(self) -> dict[str, Any]:
        pass

    @abstractmethod
    async def get_namespaces(self) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    async def get_collections(self, namespace: str) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    async def get_fields(self, namespace: str, collection: str) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    async def execute_query(self, query: str) -> list[dict[str, Any]]:
        pass

    async def get_schemas(self) -> list[dict[str, Any]]:
        return await self.get_namespaces()

    async def get_tables(self, schema: str) -> list[dict[str, Any]]:
        return await self.get_collections(schema)

    async def get_columns(self, schema: str, table: str) -> list[dict[str, Any]]:
        return await self.get_fields(schema, table)