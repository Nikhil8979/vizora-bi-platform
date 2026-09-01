from app.query_engine.ast.expressions import (
    Aggregate,
    BinaryExpression,
    Column,
    Expression,
    Literal,
    Comparison,
    LogicalExpression,
    NotExpression,
    InExpression,
    BetweenExpression,
    IsNullExpression,
)
from app.query_engine.ast.query import Query
from app.query_engine.validation.error import QueryValidationError


class HavingValidator:

    def validate(self, query: Query) -> list[QueryValidationError]:
        errors: list[QueryValidationError] = []

        # No HAVING clause → nothing to validate
        if query.having is None:
            return errors

        # Collect columns from GROUP BY
        group_by_columns = {
            expression.name
            for expression in query.group_by
            if isinstance(expression, Column)
        }

        # Find non-aggregated columns used in HAVING
        columns = self._get_non_aggregated_columns(
            query.having
        )

        # Every non-aggregated column in HAVING
        # must be present in GROUP BY.
        for column in columns:
            if column not in group_by_columns:
                errors.append(
                    QueryValidationError(
                        message=f"having: column '{column}' must appear in GROUP BY or be used inside an aggregate function",
                        code="COLUMN_NOT_IN_GROUP_BY",
                        path="having"
                    )
                )

        return errors

    def _get_non_aggregated_columns(
        self,
        expression: Expression,
    ) -> set[str]:

        # SUM(revenue)
        #
        # revenue is inside an aggregate,
        # so it does not need GROUP BY.
        if isinstance(expression, Aggregate):
            return set()

        # product
        #
        # Non-aggregated column.
        if isinstance(expression, Column):
            return {expression.name}

        # 10000
        #
        # Literals don't need GROUP BY.
        if isinstance(expression, Literal):
            return set()

        # revenue * quantity
        if isinstance(expression, BinaryExpression):
            return (
                self._get_non_aggregated_columns(expression.left)
                | self._get_non_aggregated_columns(expression.right)
            )

        # SUM(revenue) > 10000
        if isinstance(expression, Comparison):
            return (
                self._get_non_aggregated_columns(expression.left)
                | self._get_non_aggregated_columns(expression.right)
            )

        # condition1 AND condition2
        if isinstance(expression, LogicalExpression):
            columns: set[str] = set()

            for expr in expression.expressions:
                columns.update(
                    self._get_non_aggregated_columns(expr)
                )

            return columns

        # NOT (...)
        if isinstance(expression, NotExpression):
            return self._get_non_aggregated_columns(
                expression.expression
            )

        # revenue IN (...)
        if isinstance(expression, InExpression):
            columns = self._get_non_aggregated_columns(
                expression.expression
            )

            for value in expression.values:
                columns.update(
                    self._get_non_aggregated_columns(value)
                )

            return columns

        # revenue BETWEEN 100 AND 500
        if isinstance(expression, BetweenExpression):
            return (
                self._get_non_aggregated_columns(expression.expression)
                | self._get_non_aggregated_columns(expression.lower)
                | self._get_non_aggregated_columns(expression.upper)
            )

        # revenue IS NULL
        if isinstance(expression, IsNullExpression):
            return self._get_non_aggregated_columns(
                expression.expression
            )

        return set()

