
from uuid import uuid4

from app.query_engine.ast.query import (
    Query,
    TableRef,
    SelectItem,
    OrderItem,
    SortDirection,
)

from app.query_engine.ast.expressions import (
    Aggregate,
    AggregateFunction,
    Column,
    Comparison,
    ComparisonOperator,
    Literal,
)

from app.query_engine.compiler.query import (
    SQLCompiler as QueryCompiler,
)


def test_compile_sales_query():

    query = Query(
        datasource_id=uuid4(),

        table=TableRef(
            catalog="vizora",
            schema="analytics",
            name="sales",
        ),

        select=(
            SelectItem(
                expression=Column("product"),
                alias="product_name",
            ),

            SelectItem(
                expression=Aggregate(
                    function=AggregateFunction.SUM,
                    expression=Column("revenue"),
                ),
                alias="total_revenue",
            ),
        ),

        where=Comparison(
            left=Column("revenue"),
            operator=ComparisonOperator.GT,
            right=Literal(1000),
        ),

        group_by=(
            Column("product"),
        ),

        order_by=(
            OrderItem(
                expression=Column("total_revenue"),
                direction=SortDirection.DESC,
            ),
        ),

        limit=100,
    )

    compiler = QueryCompiler()

    sql = compiler.compile(query)
    print(sql)
    expected = (
        "SELECT product AS product_name, "
        "SUM(revenue) AS total_revenue\n"
        "FROM vizora.analytics.sales\n"
        "WHERE (revenue > 1000)\n"
        "GROUP BY product\n"
        "ORDER BY total_revenue DESC\n"
        "LIMIT 100"
    )

    assert sql == expected

