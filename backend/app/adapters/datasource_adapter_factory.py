from app.models.data_sources import DataSource, DataSourceType


class DataSourceAdapterFactory:
    @staticmethod
    def create(data_source: DataSource, credentials: dict):
        data_source_type = data_source.type
        if data_source_type == DataSourceType.BIGQUERY:
            from app.adapters.bigquery import BigQueryAdapter
            return BigQueryAdapter(data_source.configuration, credentials)
        else:
            raise ValueError(f"Unsupported data source type: {data_source_type}")
     