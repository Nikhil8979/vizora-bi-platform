from dataclasses import dataclass

@dataclass(frozen=True)
class ColumnMetadata:
    name: str
    data_type: str

@dataclass(frozen=True)
class ValidationContext:
    columns:dict[str,ColumnMetadata]