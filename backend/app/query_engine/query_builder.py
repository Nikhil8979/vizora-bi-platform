
from app.models.data_sources import DataSource
from app.query_engine.engine import QueryEngine
from app.adapters.datasource_adapter_factory import DataSourceAdapterFactory
from app.query_engine.factory import QueryEngineFactory
from app.query_engine.validation.query_validator import QueryValidator
from app.query_engine.result.normalizer import ResultNormalizer


class QueryBuilder:
    @staticmethod
    def build(data_source: DataSource, credentials: dict) -> QueryEngine:
        adapter = DataSourceAdapterFactory.create(data_source, credentials)
        factory = QueryEngineFactory()
        compiler = factory.create_compiler(data_source.type)
        executor = factory.create_executor(data_source.type, adapter)
        validator = QueryValidator()
        normalizer = ResultNormalizer()
        return QueryEngine(validator, compiler, executor, normalizer)
