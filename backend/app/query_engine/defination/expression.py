from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Union

from pydantic import BaseModel, Field


class ExpressionType(StrEnum):
    COLUMN = "column"
    LITERAL = "literal"


class ColumnExpression(BaseModel):
    type: ExpressionType = ExpressionType.COLUMN

    name: str = Field(min_length=1)


class LiteralExpression(BaseModel):
    type: ExpressionType = ExpressionType.LITERAL

    value: object


ExpressionDefinition = Annotated[
    Union[
        ColumnExpression,
        LiteralExpression,
    ],
    Field(discriminator="type"),
]