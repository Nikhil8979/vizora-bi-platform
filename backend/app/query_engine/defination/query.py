from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from .dimension import DimensionDefinition
from .metric import MetricDefinition
from .filter import FilterExpression
from .sort import SortDefinition


class TableReference(BaseModel):
    catalog: str | None = None
    schema: str | None = None
    name: str = Field(min_length=1)


class QueryDefinition(BaseModel):
    data_source_id: UUID

    table: TableReference

    dimensions: list[DimensionDefinition] = Field(
        default_factory=list
    )

    metrics: list[MetricDefinition] = Field(
        default_factory=list
    )

    filters: FilterExpression | None = None
    having: FilterExpression | None = None
    sort: list[SortDefinition] = Field(
        default_factory=list
    )

    limit: int = Field(
        default=100,
        ge=1,
        le=10_000
    )

    distinct: bool = False    

    @field_validator("filters", "having", mode="before")
    @classmethod
    def empty_object_to_none(cls, value: object) -> object:
        # Clients sometimes send {} for optional filter sections.
        # Normalize to None so discriminator validation is skipped.
        if value == {}:
            return None
        return value