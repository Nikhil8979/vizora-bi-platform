from pydantic import BaseModel
class QueryColumn(BaseModel):
    name: str
    type: str

class QueryRow(BaseModel):
    values: list[object]

class QueryResult(BaseModel):
    columns: list[QueryColumn]
    rows: list[QueryRow]
    row_count: int