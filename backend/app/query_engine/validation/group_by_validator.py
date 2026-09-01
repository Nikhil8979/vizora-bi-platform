from app.query_engine.ast.expressions import (
    Aggregate,
    BinaryExpression,
    Column,
    Expression,
    Literal,
)
from app.query_engine.ast.query import Query
from app.query_engine.validation.error import QueryValidationError


class GroupByValidator:

    def validate(self, query: Query) -> list[QueryValidationError]:

        errors: list[QueryValidationError] = []

        # Check whether SELECT contains aggregation.
        has_aggregate = any(
            self._contains_aggregate(item.expression)
            for item in query.select
        )

        # No aggregation means there is no
        # aggregate GROUP BY rule to enforce.
        if not has_aggregate:
            return errors

        # Collect columns from GROUP BY.
        group_by_columns = {
            expression.name
            for expression in query.group_by
            if isinstance(expression, Column)
        }

        # Check every SELECT expression.
        for index, item in enumerate(query.select):

            columns = self._get_non_aggregated_columns(
                item.expression
            )

            for column in columns:

                if column not in group_by_columns:

                    errors.append(
                        QueryValidationError(
                            message=f"select[{index}]: column '{column}' must appear in GROUP BY or be used inside an aggregate function",
                            code="COLUMN_NOT_IN_GROUP_BY",
                            path=f"select[{index}]"
                        )
                    )

        return errors

    def _contains_aggregate(
        self,
        expression: Expression,
    ) -> bool:

        if isinstance(expression, Aggregate):
            return True

        if isinstance(expression, BinaryExpression):
            return (
                self._contains_aggregate(expression.left)
                or self._contains_aggregate(expression.right)
            )

        return False

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
        # This column must appear in GROUP BY.
        if isinstance(expression, Column):
            return {expression.name}

        # 100
        #
        # Literals do not need GROUP BY.
        if isinstance(expression, Literal):
            return set()

        # revenue * quantity
        #
        # Both sides are inspected.
        if isinstance(expression, BinaryExpression):
            return (
                self._get_non_aggregated_columns(
                    expression.left
                )
                |
                self._get_non_aggregated_columns(
                    expression.right
                )
            )

        return set()
