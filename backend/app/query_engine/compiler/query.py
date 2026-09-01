from app.query_engine.ast.query import Query
from app.query_engine.compiler.expressions import ExpressionCompiler

class SQLCompiler:
    def __init__(self):
        self.expression_compiler = ExpressionCompiler()

    def compile(self,query:Query)->str:
        parts:list[str] = []
        parts.append(self._compile_select(query))
        parts.append(self._compile_from(query))
        if query.where:
            parts.append(self._compile_where(query))
        if query.group_by:
            parts.append(self._compile_group_by(query))
        if query.having:
            parts.append(self._compile_having(query))
        if query.order_by:
            parts.append(self._compile_order_by(query))
        if query.limit is not None:
            parts.append(self._compile_limit(query))
        return "\n".join(parts)    

    def _compile_select(self,query:Query)->str:
        distinct = "DISTINCT " if query.distinct else ""
        expressions = []
        for item in query.select:
            expression = self.expression_compiler.compile(item.expression)
            if item.alias:
                expression += f" AS {item.alias}"
            expressions.append(expression)
        return f"SELECT {distinct}{', '.join(expressions)}"

    def _compile_from(self,query:Query)->str:
        table = query.table
        parts = []
        if table.catalog:
            parts.append(table.catalog)
        if table.schema:
            parts.append(table.schema)
        parts.append(table.name)
        table_name = ".".join(parts)    
        return f"FROM {table_name}"

    def _compile_where(self,query:Query)->str:
        expression = self.expression_compiler.compile(query.where)
        return f"WHERE {expression}"

    def _compile_group_by(self,query:Query)->str:
        expressions = [self.expression_compiler.compile(expr) for expr in query.group_by]
        return f"GROUP BY {', '.join(expressions)}"

    def _compile_having(self,query:Query)->str:
        expression = self.expression_compiler.compile(query.having)
        return f"HAVING {expression}"

    def _compile_order_by(self,query:Query)->str:
        expressions = []
        for item in query.order_by:
            expression = self.expression_compiler.compile(item.expression)
            if item.direction:
                expression += f" {item.direction}"
            expressions.append(expression)
        return f"ORDER BY {', '.join(expressions)}"

    def _compile_limit(self,query:Query)->str:
        return f"LIMIT {query.limit}"