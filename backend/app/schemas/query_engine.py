from typing import Any
from pydantic import BaseModel


class QueryResult(BaseModel):
    columns: tuple[str, ...] | list[str]
    rows: tuple[dict[str, Any], ...] | list[dict[str, Any]]
    row_count: int

    model_config = {
        "from_attributes": True
    }