from app.query_engine.ast.expressions import (
    Column,
    Expression,
)
from app.query_engine.ast.query import Query
from app.query_engine.validation.error import QueryValidationError


class OrderByValidator:

    def validate(
        self,
        query: Query,
    ) -> list[QueryValidationError]:

        errors: list[QueryValidationError] = []

        # Collect aliases defined in SELECT.
        select_aliases = {
            item.alias
            for item in query.select
            if item.alias is not None
        }

        for index, order_item in enumerate(query.order_by):

            expression = order_item.expression

            # ORDER BY column/alias
            if isinstance(expression, Column):

                column_name = expression.name

                # If it is a SELECT alias, it is valid.
                if column_name in select_aliases:
                    continue

                # Otherwise, it will be validated against
                # the actual table columns by ExpressionValidator.

        return errors
