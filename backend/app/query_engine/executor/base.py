from abc import ABC, abstractmethod
from typing import Any


class BaseQueryExecutor(ABC):

    @abstractmethod
    async def execute(
        self,
        sql: str,
    ) -> Any:
        """
        Execute compiled SQL against a data source.
        """
        pass
