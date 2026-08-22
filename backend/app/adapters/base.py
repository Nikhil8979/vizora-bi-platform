from abc import ABC, abstractmethod


class DataSourceAdapter(ABC):

    @abstractmethod
    async def test_connection(self):
        pass

    @abstractmethod
    async def get_schemas(self):
        pass

    @abstractmethod
    async def get_tables(self, schema: str):
        pass

    @abstractmethod
    async def get_columns(self, schema: str, table: str):
        pass

    @abstractmethod
    async def execute_query(self, query: str):
        pass