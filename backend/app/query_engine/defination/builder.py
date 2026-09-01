from ..ast.query import OrderItem, Query, SelectItem, SortDirection as AstSortDirection, TableRef
from .filter import (
    BetweenFilter,
    ComparisonFilter,
    FilterExpression,
    LogicalFilter,
    NotFilter,
    NullFilter,
    SetFilter,
)
from .query import QueryDefinition
from .dimension import DimensionDefinition
from .metric import MetricDefinition
from .sort import SortDefinition
from ..ast.expressions import (
    Aggregate,
    AggregateFunction,
    BetweenExpression,
    Column,
    Comparison,
    ComparisonOperator,
    InExpression,
    IsNullExpression,
    Literal,
    LogicalExpression,
    LogicalOperator,
    NotExpression,
)


class QueryDefinitionBuilder:
    def build(self, definition: QueryDefinition) -> Query:
        table = self._build_table(definition)
        select_items = [self._build_dimension(dimension) for dimension in definition.dimensions]
        select_items.extend(
            self._build_metric(metric)
            for metric in definition.metrics
        )

        where = self._build_filter(definition.filters) if definition.filters else None
        having = self._build_filter(definition.having) if definition.having else None
        group_by = tuple(Column(name=dimension.column) for dimension in definition.dimensions)
        order_by = tuple(self._build_sort(sort) for sort in definition.sort)
        return Query(
            datasource_id=definition.data_source_id,
            table=table,
            select=tuple(select_items),
            where=where,
            group_by=group_by,
            having=having,
            order_by=order_by,
            limit=definition.limit,
            distinct=definition.distinct
        )

    def _build_table(self, definition: QueryDefinition) -> TableRef:
        return TableRef(
            catalog=definition.table.catalog,
            schema=definition.table.schema,
            name=definition.table.name
        )

    def _build_dimension(self, dimension: DimensionDefinition) -> SelectItem:
        return SelectItem(
            expression=Column(name=dimension.column),
            alias=dimension.alias
        )

    def _build_metric(self, metric: MetricDefinition) -> SelectItem:
        return SelectItem(
            expression=Aggregate(
                function=AggregateFunction(metric.aggregation.value),
                expression=Column(name=metric.column),
            ),
            alias=metric.alias
        )

    def _build_filter(self, filter: FilterExpression):
        if isinstance(filter, ComparisonFilter):
            return self._build_comparison(filter)
        if isinstance(filter, SetFilter):
            return self._build_set_filter(filter)
        if isinstance(filter, BetweenFilter):
            return self._build_between_filter(filter)
        if isinstance(filter, NullFilter):
            return self._build_null_filter(filter)
        if isinstance(filter, LogicalFilter):
            return self._build_logical_filter(filter)
        if isinstance(filter, NotFilter):
            return self._build_not_filter(filter)
        # Handle other filter types here as needed
        raise NotImplementedError(f"Filter type {type(filter)} not supported")

    def _build_comparison(self, filter_definition: ComparisonFilter) -> Comparison:
        return Comparison(
            left=Column(name=filter_definition.column),
            operator=ComparisonOperator(filter_definition.operator.value),
            right=Literal(filter_definition.value)
        )

    def _build_set_filter(self, filter_definition: SetFilter) -> InExpression:
        return InExpression(
            expression=Column(name=filter_definition.column),
            values=tuple(Literal(value) for value in filter_definition.values),
            negated=filter_definition.operator.value == "NOT IN"
        )

    def _build_between_filter(self, filter_definition: BetweenFilter) -> BetweenExpression:
        return BetweenExpression(
            expression=Column(name=filter_definition.column),
            lower=Literal(filter_definition.lower),
            upper=Literal(filter_definition.upper),
            negated=filter_definition.operator.value == "NOT BETWEEN"
        )

    def _build_null_filter(self, filter_definition: NullFilter) -> IsNullExpression:
        return IsNullExpression(
            expression=Column(name=filter_definition.column),
            negated=not filter_definition.is_null
        )

    def _build_logical_filter(self, filter_definition: LogicalFilter) -> LogicalExpression:
        return LogicalExpression(
            operator=LogicalOperator(filter_definition.operator.value),
            expressions=tuple(self._build_filter(condition) for condition in filter_definition.conditions)
        )

    def _build_not_filter(self, filter_definition: NotFilter) -> NotExpression:
        return NotExpression(
            expression=self._build_filter(filter_definition.condition)
        )

    def _build_sort(self, sort: SortDefinition) -> OrderItem:
        return OrderItem(
            expression=Column(name=sort.field),
            direction=AstSortDirection(sort.direction.value),
        )