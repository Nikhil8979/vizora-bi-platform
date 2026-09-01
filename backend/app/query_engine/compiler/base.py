from abc import ABC, abstractmethod
from app.query_engine.ast.query import Query

class BaseSQLCompiler(ABC):
    def compile(self, query: Query) -> str:
        return self.compile_query(query)
    @abstractmethod
    def compile_query(self, query: Query) -> str:
        """
        Compile the given query into a SQL string.
        """
        pass