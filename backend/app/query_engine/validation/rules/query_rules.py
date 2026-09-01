    
from app.query_engine.ast.expressions import (
    Aggregate,
    BinaryExpression,
    Column,
    Expression,
    Literal,
)
from app.query_engine.ast.query import Query
from app.query_engine.validation.context import ValidationContext


class GroupByExpressionValidator:

    def validate(
        self,
        query: Query,
        context: ValidationContext,
    ) -> list[str]:

        errors: list[str] = []

        for index, expression in enumerate(query.group_by):

            errors.extend(
                self._validate_expression(
                    expression,
                    context,
                    f"group_by[{index}]",
                )
            )

        return errors

    def _validate_expression(
        self,
        expression: Expression,
        context: ValidationContext,
        path: str,
    ) -> list[str]:

        errors: list[str] = []

        # --------------------------------
        # 1. Column
        # --------------------------------
        #
        # GROUP BY product
        #
        # First check that "product" exists
        # in the datasource metadata.
        #
        if isinstance(expression, Column):

            if expression.name not in context.columns:
                errors.append(
                    f"{path}: column '{expression.name}' "
                    "does not exist"
                )

            return errors

        # --------------------------------
        # 2. Aggregate
        # --------------------------------
        #
        # GROUP BY SUM(revenue)
        #
        # Not allowed in Level 1.
        #
        if isinstance(expression, Aggregate):

            errors.append(
                f"{path}: aggregate expressions are not "
                "allowed in GROUP BY"
            )

            return errors

        # --------------------------------
        # 3. Literal
        # --------------------------------
        #
        # GROUP BY 100
        #
        # Not allowed in Level 1.
        #
        if isinstance(expression, Literal):

            errors.append(
                f"{path}: literal expressions are not "
                "allowed in GROUP BY"
            )

            return errors

        # --------------------------------
        # 4. Binary Expression
        # --------------------------------
        #
        # GROUP BY revenue + tax
        #
        # Not supported in Level 1.
        #
        if isinstance(expression, BinaryExpression):

            errors.append(
                f"{path}: binary expressions are not "
                "allowed in GROUP BY"
            )

            return errors

        # --------------------------------
        # 5. Unknown expression
        # --------------------------------

        errors.append(
            f"{path}: unsupported expression in GROUP BY"
        )

        return errors

