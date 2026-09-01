from app.query_engine.result.models import QueryResult

class ResultNormalizer:
    def normalize(self, rows: list[dict]) -> QueryResult:
        """
        Normalize the query result to ensure consistent structure.
        """
        if not rows:
            return QueryResult(
                columns=tuple(),
                rows=tuple(),
                row_count=0,
            )
        columns = tuple(rows[0].keys())
       
        return QueryResult(
            columns=columns,
            rows=tuple(rows),
            row_count=len(rows),
        )
        