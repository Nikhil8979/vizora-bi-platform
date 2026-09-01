from enum import StrEnum
from pydantic import BaseModel, Field

class Aggregation(StrEnum):
    SUM = "SUM"
    COUNT = "COUNT"
    COUNT_DISTINCT = "COUNT_DISTINCT"
    AVG = "AVG"
    MIN = "MIN"
    MAX = "MAX"

class MetricDefinition(BaseModel):
    column: str = Field(..., min_length=1, description="The name of the column to be used as a metric.")
    alias: str | None = None
    aggregation: Aggregation = Field(..., description="The aggregation function to be applied to the metric.")