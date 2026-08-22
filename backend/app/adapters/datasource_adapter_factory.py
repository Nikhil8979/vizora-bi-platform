from app.models.data_sources import DataSource, DataSourceType


class DataSourceAdapterFactory:
    _registry: dict[DataSourceType, type] = {}

    @classmethod
    def register(cls, data_source_type: DataSourceType, adapter_cls: type) -> None:
        cls._registry[data_source_type] = adapter_cls

    @classmethod
    def create(cls, data_source: DataSource, credentials: dict):
        adapter_cls = cls._registry.get(data_source.type)
        if adapter_cls is None:
            raise ValueError(f"Unsupported data source type: {data_source.type}")
        return adapter_cls(data_source.configuration, credentials)


from app.adapters.bigquery import BigQueryAdapter

DataSourceAdapterFactory.register(DataSourceType.BIGQUERY, BigQueryAdapter)
     