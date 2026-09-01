from dataclasses import dataclass

@dataclass(frozen=True)
class QueryResult:
    columns: tuple[str, ...]
    rows: tuple[dict,...]
    row_count: int