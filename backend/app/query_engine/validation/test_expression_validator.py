from pathlib import Path
import sys



# Allow running this file directly from any working directory.
BACKEND_ROOT = Path(__file__).resolve().parents[3]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


from app.query_engine.ast.expressions import (
    Aggregate,
    AggregateFunction,
    Column,
    Literal,
    LogicalExpression,
    Comparison,
    NotExpression,
    ComparisonOperator,
)


from app.query_engine.validation.context import (
    ValidationContext,
    ColumnMetadata,
)

from app.query_engine.validation.expression_validator import (
    ExpressionValidator,
)


def print_validation_result(case_name: str, errors: list) -> None:
    print(f"\n{case_name}")
    if not errors:
        print("  OK: no validation errors")
        return

    print(f"  ERROR COUNT: {len(errors)}")
    for index, error in enumerate(errors, start=1):
        print(
            f"  {index}. code={error.code} path={error.path} message={error.message}"
        )


def run_demo() -> None:
    context = ValidationContext(
        columns={
            "product": ColumnMetadata(
                name="product",
                data_type="STRING",
            ),
            "revenue": ColumnMetadata(
                name="revenue",
                data_type="NUMERIC",
            ),
        }
    )

    validator = ExpressionValidator()

    # Valid column
    # errors = validator.validate(
    #     Column("revenue"),
    #     context,
    #     "select[0]",
    # )
    # print_validation_result("Valid column", errors)

    # # Invalid column
    # errors = validator.validate(
    #     Column("unknown_column"),
    #     context,
    #     "select[1]",
    # )
    # print_validation_result("Invalid column", errors)

    # # Valid literal
    # errors = validator.validate(
    #     Literal(1000),
    #     context,
    #     "where.right",
    # )
    # print_validation_result("Valid literal", errors)

    # errors = validator.validate(
    #         Literal(""),
    #         context,
    #         "where.right",
    #     )
    # print_validation_result("InValid literal", errors)

    # # Valid aggregate
    # errors = validator.validate(
    #     Aggregate(AggregateFunction.SUM, Column("revenue")),
    #     context,
    #     "select[2]",
    # )
    # print_validation_result("Valid aggregate", errors)

    # # Invalid aggregate (unknown inner column)
    # errors = validator.validate(
    #     Aggregate(AggregateFunction.SUM, Column("unknown_column")),
    #     context,
    #     "select[3]",
    # )
    # print_validation_result("Invalid aggregate", errors)

    # expression = LogicalExpression(
    #     operator="AND",
    #     expressions=[
    #         Comparison(
    #             left=Column("product"),
    #             operator="=",
    #             right=Literal("Widget"),
    #         ),
    #         Comparison(
    #             left=Column("revensdue"),
    #             operator=">",
    #             right=Literal(1000),
    #         ),
    #     ],
    # )
    # errors = validator.validate(
    #     expression,
    #     context,
    #     "where[0]",
    # )
    # print_validation_result("Valid logical expression", errors)
    
    expression = NotExpression(
        expression=Comparison(
            left=Column("revedsnue"),
            operator=ComparisonOperator.GT,
            right=Literal(1000),
        )
    )
    errors = validator.validate(
        expression,
        context,
        "where[1]",
    )
    print_validation_result("Valid NOT expression", errors)


if __name__ == "__main__":
    run_demo()