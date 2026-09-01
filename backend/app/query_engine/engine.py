from dataclasses import dataclass

from app.query_engine.compiler.query import SQLCompiler as QueryCompiler
from app.query_engine.executor.base import BaseQueryExecutor
from app.query_engine.result.normalizer import ResultNormalizer
from app.query_engine.validation.query_validator import QueryValidator


@dataclass
class QueryEngine:

    validator: QueryValidator
    compiler: QueryCompiler
    executor: BaseQueryExecutor
    normalizer: ResultNormalizer
