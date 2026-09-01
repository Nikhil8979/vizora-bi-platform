from app.query_engine.ast.expressions import (
    Expression,
    Column,
    Literal,
    Aggregate,
    BinaryExpression,
    Comparison,
    LogicalExpression,
    NotExpression,
    InExpression,
    BetweenExpression,
    IsNullExpression,
)

class ExpressionCompiler:

    def compile(self, expression: Expression) -> str:
        if isinstance(expression, Column):
            return self._compile_column(expression)
        if isinstance(expression, Literal):
            return self._compile_literal(expression)
        if isinstance(expression, Aggregate):
            return self._compile_aggregate(expression)
        if isinstance(expression, BinaryExpression):
            return self._compile_binary_expression(expression)
        if isinstance(expression, Comparison):
            return self._compile_comparison(expression)
        if isinstance(expression, LogicalExpression):
            return self._compile_logical(expression)
        if isinstance(expression, NotExpression):
            return self._compile_not(expression)
        if isinstance(expression, InExpression):
            return self._compile_in(expression)
        if isinstance(expression, BetweenExpression):
            return self._compile_between(expression)
        if isinstance(expression, IsNullExpression):
            return self._compile_is_null(expression)
        raise ValueError(f"Unsupported expression type: {type(expression)}")


    def _compile_column(self, expression: Column) -> str:
        return expression.name

    def _compile_literal(self, expression: Literal) -> str:
        value = expression.value
        if value is None:
            return "NULL"
        if isinstance(value,bool):
            return "TRUE" if value else "FALSE"
        if isinstance(value, str):
            escaped_value = value.replace("'", "''")
            return f"'{escaped_value}'"
        return str(value)

    def _compile_aggregate(self, expression: Aggregate) -> str:
        function_name = expression.function.value.upper()
        compiled_expression = self.compile(expression.expression)
        if function_name == "COUNT_DISTINCT":
            return f"COUNT(DISTINCT {compiled_expression})"
        return f"{function_name}({compiled_expression})"

    def _compile_binary_expression(self, expression: BinaryExpression) -> str:
        left = self.compile(expression.left)
        right = self.compile(expression.right)
        operator = expression.operator.value
        return f"({left} {operator} {right})"

    def _compile_comparison(self, expression: Comparison) -> str:
        left = self.compile(expression.left)
        right = self.compile(expression.right)
        operator = expression.operator.value
        return f"({left} {operator} {right})"
    def _compile_logical(self, expression: LogicalExpression) -> str:
        if not expression.expressions:
            raise ValueError("LogicalExpression must have at least one expression.")
        operator = expression.operator.value
        compiled_expressions = [self.compile(expr) for expr in expression.expressions]
        return f"({f' {operator} '.join(compiled_expressions)})"
    def _compile_not(self, expression: NotExpression) -> str:
        compiled_expression = self.compile(expression.expression)
        return f"(NOT {compiled_expression})"
    def _compile_in(self, expression: InExpression) -> str:
        compiled_expression = self.compile(expression.expression)
        compiled_values = ", ".join(self.compile(value) for value in expression.values)
        negation = "NOT " if expression.negated else ""
        return f"({compiled_expression} {negation}IN ({compiled_values}))"
    def _compile_between(self, expression: BetweenExpression) -> str:
        compiled_expression = self.compile(expression.expression)
        compiled_lower = self.compile(expression.lower)
        compiled_upper = self.compile(expression.upper)
        negation = "NOT " if expression.negated else ""
        return f"({compiled_expression} {negation}BETWEEN {compiled_lower} AND {compiled_upper})"
    def _compile_is_null(self, expression: IsNullExpression) -> str:
        compiled_expression = self.compile(expression.expression)
        negation = "IS NOT NULL" if expression.negated else "IS NULL"
        return f"({compiled_expression} {negation})"