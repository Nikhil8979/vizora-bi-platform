from app.query_engine.ast.expressions import (
    BinaryExpression,
    Column,
    Literal,
    Aggregate,  
)
from app.query_engine.validation.error import QueryValidationError

from app.query_engine.ast.query import Query
from app.query_engine.validation.context import ValidationContext


class GroupByExpressionValidator:

    def validate(
        self,
        query: Query,
        context: ValidationContext,
    ) -> list[QueryValidationError]:

        errors: list[QueryValidationError] = []

        for index, expression in enumerate(query.group_by):

            if isinstance(expression, Column):

                if expression.name not in context.columns:
                    errors.append(
                        QueryValidationError(
                            message=f"group_by[{index}]: column '{expression.name}' does not exist",
                            code="COLUMN_NOT_FOUND",
                            path=f"group_by[{index}]"
                        )
                    )

            elif isinstance(expression, Aggregate):

                errors.append(
                    QueryValidationError(
                        message=f"group_by[{index}]: aggregate expressions are not allowed in GROUP BY",
                        code="AGGREGATE_NOT_ALLOWED",
                        path=f"group_by[{index}]"
                    )
                )

            elif isinstance(expression, Literal):

                errors.append(
                    QueryValidationError(
                        message=f"group_by[{index}]: literal expressions are not allowed in GROUP BY",
                        code="LITERAL_NOT_ALLOWED",
                        path=f"group_by[{index}]"
                    )
                )

            elif isinstance(expression, BinaryExpression):

                errors.append(
                    QueryValidationError(
                        message=f"group_by[{index}]: binary expressions are not allowed in GROUP BY",
                        code="BINARY_NOT_ALLOWED",
                        path=f"group_by[{index}]"
                    )
                )

            else:

                errors.append(
                    QueryValidationError(
                        message=f"group_by[{index}]: unsupported expression in GROUP BY",
                        code="UNSUPPORTED_EXPRESSION",
                        path=f"group_by[{index}]"
                    )
                )

        return errors

