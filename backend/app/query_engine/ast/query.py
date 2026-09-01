from dataclasses import dataclass, field
from enum import StrEnum

from uuid import UUID
from .expressions import Expression

@dataclass(frozen=True)
class TableRef:
    catalog: str | None
    schema: str | None
    name: str


@dataclass(frozen=True)
class SelectItem:
    expression: Expression
    alias: str | None = None


class SortDirection(StrEnum):
    ASC = "ASC"
    DESC = "DESC"
    
@dataclass(frozen=True)
class OrderItem:
    expression: Expression
    direction: SortDirection = SortDirection.ASC


@dataclass(frozen=True)
class Query:
    datasource_id: UUID
    table: TableRef
    select: tuple[SelectItem, ...]

    where: Expression | None = None

    group_by: tuple[Expression, ...] = ()

    having: Expression | None = None

    order_by: tuple[OrderItem, ...] = ()

    limit: int | None = None

    distinct: bool = False