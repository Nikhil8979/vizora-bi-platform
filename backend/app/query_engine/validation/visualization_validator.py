from app.query_engine.ast.expressions import Aggregate, Column
from app.query_engine.ast.query import Query


class VisualizationValidator:

    def validate(
        self,
        visualization,
        query: Query,
    ) -> list[str]:

        errors: list[str] = []

        if visualization.type == "table":
            return errors

        if visualization.type == "number":
            errors.extend(
                self._validate_number(query)
            )

        elif visualization.type == "bar":
            errors.extend(
                self._validate_bar(
                    query,
                )
            )

        elif visualization.type == "line":
            errors.extend(
                self._validate_line(
                    query,
                )
            )

        elif visualization.type == "pie":
            errors.extend(
                self._validate_pie(
                    query,
                )
            )

        else:
            errors.append(
                f"Unsupported visualization type: "
                f"{visualization.type}"
            )

        return errors

    def _validate_number(
        self,
        query: Query,
    ) -> list[str]:

        errors: list[str] = []

        metrics = [
            item
            for item in query.select
            if isinstance(item.expression, Aggregate)
        ]

        columns = [
            item
            for item in query.select
            if isinstance(item.expression, Column)
        ]

        if len(metrics) != 1:
            errors.append(
                "number visualization requires exactly "
                "one metric"
            )

        if columns:
            errors.append(
                "number visualization cannot contain "
                "dimensions"
            )

        return errors

    def _validate_bar(
        self,
        query: Query,
    ) -> list[str]:

        errors: list[str] = []

        columns = [
            item
            for item in query.select
            if isinstance(item.expression, Column)
        ]

        metrics = [
            item
            for item in query.select
            if isinstance(item.expression, Aggregate)
        ]

        if len(columns) != 1:
            errors.append(
                "bar visualization requires exactly "
                "one dimension"
            )

        if len(metrics) != 1:
            errors.append(
                "bar visualization requires exactly "
                "one metric"
            )

        return errors

    def _validate_line(
        self,
        query: Query,
    ) -> list[str]:

        errors: list[str] = []

        columns = [
            item
            for item in query.select
            if isinstance(item.expression, Column)
        ]

        metrics = [
            item
            for item in query.select
            if isinstance(item.expression, Aggregate)
        ]

        if len(columns) != 1:
            errors.append(
                "line visualization requires exactly "
                "one dimension"
            )

        if len(metrics) != 1:
            errors.append(
                "line visualization requires exactly "
                "one metric"
            )

        return errors

    def _validate_pie(
        self,
        query: Query,
    ) -> list[str]:

        errors: list[str] = []

        columns = [
            item
            for item in query.select
            if isinstance(item.expression, Column)
        ]

        metrics = [
            item
            for item in query.select
            if isinstance(item.expression, Aggregate)
        ]

        if len(columns) != 1:
            errors.append(
                "pie visualization requires exactly "
                "one dimension"
            )

        if len(metrics) != 1:
            errors.append(
                "pie visualization requires exactly "
                "one metric"
            )

        return errors

