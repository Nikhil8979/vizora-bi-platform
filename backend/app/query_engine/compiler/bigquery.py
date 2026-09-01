from app.query_engine.ast.query import Query
from app.query_engine.compiler.query import SQLCompiler as QueryCompiler


class BigQueryCompiler(QueryCompiler):

    def _compile_from(
        self,
        query: Query,
    ) -> str:

        table = query.table

        parts = []

        if table.catalog is not None:
            parts.append(table.catalog)

        if table.schema is not None:
            parts.append(table.schema)

        parts.append(table.name)

        table_name = ".".join(parts)

        return f"FROM `{table_name}`"

