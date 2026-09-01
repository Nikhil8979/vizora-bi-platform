from .expression_validator import ExpressionValidator
from app.query_engine.validation.context import ValidationContext
from app.query_engine.validation.error import QueryValidationError
from app.query_engine.ast.query import Query
from .group_by_expression_validator import GroupByExpressionValidator
from .having_validator import HavingValidator
from .group_by_validator import GroupByValidator
from .order_by_validator import OrderByValidator
from app.query_engine.ast.expressions import (
    Column)
class QueryValidator:
    def __init__(self):
        self.expression_validator = ExpressionValidator()
        self.group_by_validator = GroupByValidator()
        self.group_by_expression_validator = GroupByExpressionValidator()
        self.having_validator = HavingValidator()
        self.order_by_validator = OrderByValidator()

    def validate(self, query: Query, context: ValidationContext) -> list[QueryValidationError]:
        errors: list[QueryValidationError] = []
        errors.extend(self._validate_table(query, context))
        errors.extend(self._validate_datasource(query, context))
        errors.extend(self._validate_select(query, context))
        errors.extend(self._validate_where(query, context))
        errors.extend(self._validate_group_by(query, context))
        errors.extend(self._validate_having(query, context))
        errors.extend(self._validate_order_by(query, context))
        errors.extend(self._validate_limit(query, context))
        return errors

    def _validate_select(self, query: Query, context: ValidationContext) -> list[QueryValidationError]:
        errors: list[QueryValidationError] = []
        if not query.select:
            errors.append(QueryValidationError(
                message="Query must contain at least one select expression.",
                code="EMPTY_SELECT",
                path="select"
            ))
        for index, select_item in enumerate(query.select):
            errors.extend(self.expression_validator.validate(select_item.expression, context, f"select[{index}].expression"))    
        return errors

    def _validate_where(self, query: Query, context: ValidationContext) -> list[QueryValidationError]:
        if query.where is None:
            return []
        return self.expression_validator.validate(query.where, context, "where")

    def _validate_group_by(self, query: Query, context: ValidationContext) -> list[QueryValidationError]:
        errors: list[QueryValidationError] = []

        for index, expression in enumerate(query.group_by):
            errors.extend(
                self.expression_validator.validate(expression, context, f"group_by[{index}]")
            )


        errors.extend(
            self.group_by_expression_validator.validate(query, context)
        )  
        errors.extend(
            self.group_by_validator.validate(query)
        )

        return errors

    def _validate_having(
        self,
        query: Query,
        context: ValidationContext,
    ) -> list[QueryValidationError]:

        if query.having is None:
            return []

        errors: list[QueryValidationError] = []

        # 1. Validate the expressions inside HAVING.
        errors.extend(
            self.expression_validator.validate(
                query.having,
                context,
                "having",
            )
        )

        # 2. Validate HAVING semantics with GROUP BY.
        errors.extend(
            self.having_validator.validate(query, )
        )

        return errors



    def _validate_order_by(
        self,
        query: Query,
        context: ValidationContext,
    ) -> list[QueryValidationError]:

        errors: list[QueryValidationError] = []

        # Collect SELECT aliases.
        select_aliases = {
            item.alias
            for item in query.select
            if item.alias is not None
        }

        for index, sort_item in enumerate(query.order_by):

            expression = sort_item.expression

            # If ORDER BY references a SELECT alias,
            # don't validate it against table columns.
            if isinstance(expression, Column):
                if expression.name in select_aliases:
                    continue

            # Otherwise validate the expression normally.
            errors.extend(
                self.expression_validator.validate(
                    expression,
                    context,
                    f"order_by[{index}].expression",
                )
            )

        return errors


    def _validate_limit(self, query: Query, context: ValidationContext) -> list[QueryValidationError]:
        if query.limit is None:
            return []
        if not isinstance(query.limit, int) or query.limit <= 0:
            return [
                QueryValidationError(
                    message=f"Limit must be a positive integer.",
                    code="INVALID_LIMIT",
                    path="limit"
                )
            ]
        return []

    def _validate_table(self, query: Query, context: ValidationContext) -> list[QueryValidationError]:
        errors: list[QueryValidationError] = []
        if not query.table.name:
            errors.append(QueryValidationError(
                message="Query must specify a table.",
                code="MISSING_TABLE",
                path="table"
            ))
        return errors

    def _validate_datasource(self, query: Query, context: ValidationContext) -> list[QueryValidationError]:
        if query.datasource_id is None:
            return [
                QueryValidationError(
                    message="Query must specify a data source ID.",
                    code="MISSING_DATASOURCE_ID",
                    path="data_source_id"
                )
            ]
        return []