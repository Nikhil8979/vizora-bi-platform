from pydantic import BaseModel, Field
from enum import StrEnum
from typing import Annotated, Literal, Union

class ComparisonOperator(StrEnum):
    EQ = "="
    NE = "!="
    GT = ">"
    LT = "<"
    GTE = ">="
    LTE = "<="
    LIKE = "LIKE"

class SetOperator(StrEnum):
    IN = "IN"
    NOT_IN = "NOT IN"

class LogicalOperator(StrEnum):
    AND = "AND"
    OR = "OR"


class BetweenOperator(StrEnum):
    BETWEEN = "BETWEEN"
    NOT_BETWEEN = "NOT BETWEEN"

class ComparisonFilter(BaseModel):
    type: Literal["comparison"] = "comparison"

    column: str = Field(min_length=1)
    operator: ComparisonOperator
    value: object

class SetFilter(BaseModel):
    type: Literal["set"] = "set"

    column: str = Field(min_length=1)
    operator: SetOperator

    values: list[object] = Field(min_length=1)

class BetweenFilter(BaseModel):
    type: Literal["between"] = "between"

    column: str = Field(min_length=1)
    operator: BetweenOperator = BetweenOperator.BETWEEN

    lower: object
    upper: object

class NullFilter(BaseModel):
    type: Literal["null"] = "null"

    column: str = Field(min_length=1)

    is_null: bool

class LogicalFilter(BaseModel):
    type: Literal["logical"] = "logical"

    operator: LogicalOperator

    conditions: list["FilterExpression"] = Field(min_length=1)

class NotFilter(BaseModel):
    type: Literal["not"] = "not"

    condition: "FilterExpression"

FilterExpression = Annotated[
    Union[
        ComparisonFilter,
        SetFilter,
        BetweenFilter,
        NullFilter,
        LogicalFilter,
        NotFilter,
    ],
    Field(discriminator="type"),
]


LogicalFilter.model_rebuild()
NotFilter.model_rebuild()