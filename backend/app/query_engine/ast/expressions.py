from dataclasses import dataclass
from enum import StrEnum


@dataclass(frozen=True)
class Expression:
    pass



@dataclass(frozen=True)
class Column(Expression):
    name: str

@dataclass(frozen=True)
class Literal(Expression):
    value: object




class AggregateFunction(StrEnum):
    SUM = "SUM"
    COUNT = "COUNT"
    COUNT_DISTINCT = "COUNT_DISTINCT"
    AVG = "AVG"
    MIN = "MIN"
    MAX = "MAX"


@dataclass(frozen=True)
class Aggregate(Expression):
    function: AggregateFunction
    expression: Expression

class BinaryOperator(StrEnum):
    ADD = "+"
    SUBTRACT = "-"
    MULTIPLY = "*"
    DIVIDE = "/"


@dataclass(frozen=True)
class BinaryExpression(Expression):
    left: Expression
    operator: BinaryOperator
    right: Expression


class ComparisonOperator(StrEnum):
    EQ = "="
    NE = "!="
    GT = ">"
    LT = "<"
    GTE = ">="
    LTE = "<="
    LIKE = "LIKE"


@dataclass(frozen=True)
class Comparison(Expression):
    left: Expression
    operator: ComparisonOperator
    right: Expression

class LogicalOperator(StrEnum):
    AND = "AND"
    OR = "OR"


@dataclass(frozen=True)
class LogicalExpression(Expression):
    operator: LogicalOperator
    expressions: tuple[Expression, ...]

@dataclass(frozen=True)
class NotExpression(Expression):
    expression: Expression


@dataclass(frozen=True)
class InExpression(Expression):
    expression: Expression
    values: tuple[Expression, ...]
    negated: bool = False


@dataclass(frozen=True)
class BetweenExpression(Expression):
    expression: Expression
    lower: Expression
    upper: Expression
    negated: bool = False


@dataclass(frozen=True)
class IsNullExpression(Expression):
    expression: Expression
    negated: bool = False
