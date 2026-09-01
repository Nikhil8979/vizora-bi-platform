from app.query_engine.ast.expressions import (
    Aggregate,
    Literal,
    Column,
    Expression,
    Comparison,
    LogicalExpression,
    NotExpression,
    InExpression,
    BetweenExpression,
    IsNullExpression,
)
from app.query_engine.validation.context import ValidationContext
from app.query_engine.validation.error import QueryValidationError
class ExpressionValidator:
    def validate(self,expression:Expression,context:ValidationContext,path = ""):
        errors = []
        if isinstance(expression,Column):
            errors.extend(self._validate_column(expression,context,path))

        elif isinstance(expression,Literal):
            errors.extend(self._validate_literal(expression,context,path))

        elif isinstance(expression,Aggregate):
            errors.extend(self._validate_aggregate(expression,context,path))
        elif isinstance(expression,Comparison):
            errors.extend(self._validate_comparison(expression,context,path))       
        elif isinstance(expression,LogicalExpression):
            errors.extend(self._validate_logical(expression,context,path))    
        elif isinstance(expression,NotExpression):
            errors.extend(self._validate_not(expression,context,path))
        elif isinstance(expression,InExpression):
            errors.extend(self._validate_in(expression,context,path))    
        elif isinstance(expression,BetweenExpression):
            errors.extend(self._validate_between(expression,context,path))
        elif isinstance(expression,IsNullExpression):
            errors.extend(self._validate_is_null(expression,context,path))    
        return errors

    def _validate_column(self,expression:Column,context:ValidationContext,path:str):
        if expression.name not in context.columns:
            return [
                QueryValidationError(
                    message=f"Column '{expression.name}' does not exist in the context.",
                    code="COLUMN_NOT_FOUND",
                    path=path
                )
            ]
        return []

    def _validate_literal(self,expression:Literal,context:ValidationContext,path:str):
        # For literals, we might want to check if the value is of a supported type
        if expression.value is None:
            return [
                QueryValidationError(
                    message=f"Literal value cannot be None.",
                    code="UNSUPPORTED_LITERAL",
                    path=path
                )
            ]
        return []

    def _validate_aggregate(self,expression:Aggregate,context:ValidationContext,path:str):
        # Placeholder for aggregate validation logic
        errors = []
        errors.extend(self.validate(expression.expression,context,f"{path}.expression"))
        return errors

    def _validate_comparison(self,expression:Comparison,context:ValidationContext,path:str):
        errors = []
        errors.extend(self.validate(expression.left,context,f"{path}.left"))
        errors.extend(self.validate(expression.right,context,f"{path}.right"))
        return errors

    def _validate_logical(self,expression:LogicalExpression,context:ValidationContext,path:str):
        errors = []
        for index,child_expression in enumerate(expression.expressions):
            errors.extend(self.validate(child_expression,context,f"{path}.expressions[{index}]"))
        return errors

    def _validate_not(self,expression:NotExpression,context:ValidationContext,path:str):
        return self.validate(expression.expression,context,f"{path}.expression")

    def _validate_in(self,expression:InExpression,context:ValidationContext,path:str):
        errors = []
        if not expression.values:
            errors.append(
                QueryValidationError(
                    message=f"'IN' expression must have at least one value.",
                    code="EMPTY_IN_VALUES",
                    path=path
                )
            )
        errors.extend(self.validate(expression.expression,context,f"{path}.expression"))
        for index,value in enumerate(expression.values):
            errors.extend(self.validate(value,context,f"{path}.values[{index}]"))
        return errors

    def _validate_between(self,expression:BetweenExpression,context:ValidationContext,path:str):
        errors = []
        errors.extend(self.validate(expression.expression,context,f"{path}.expression"))
        errors.extend(self.validate(expression.lower,context,f"{path}.lower"))
        errors.extend(self.validate(expression.upper,context,f"{path}.upper"))
        return errors

    def _validate_is_null(self,expression:IsNullExpression,context:ValidationContext,path:str):
        return self.validate(expression.expression,context,f"{path}.expression")