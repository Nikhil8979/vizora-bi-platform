from google.cloud import bigquery
from google.oauth2 import service_account

from app.adapters.base import DataSourceAdapter


class BigQueryAdapter(DataSourceAdapter):

    def __init__(
        self,
        configuration: dict,
        credentials: dict,
    ):
        self.project_id = configuration["project_id"]
        self.dataset = configuration["dataset"]

        self.credentials = (
            service_account.Credentials.from_service_account_info(
                credentials
            )
        )

        self.client = bigquery.Client(
            project=self.project_id,
            credentials=self.credentials,
        )

    async def test_connection(self):
        dataset_ref = self.client.dataset(
            self.dataset,
            project=self.project_id,
        )

        dataset = self.client.get_dataset(
            dataset_ref
        )

        return {
            "success": True,
            "message": "BigQuery connection successful",
            "project_id": dataset.project,
            "dataset": dataset.dataset_id,
        }

    async def get_schemas(self):

        datasets = self.client.list_datasets(
            project=self.project_id
        )

        return [
            {
                "name": dataset.dataset_id,
                "project_id": dataset.project,
            }
            for dataset in datasets
        ]

    async def get_tables(
        self,
        schema: str,
    ):

        tables = self.client.list_tables(
            f"{self.project_id}.{schema}"
        )

        return [
            {
                "name": table.table_id,
                "type": table.table_type,
            }
            for table in tables
        ]

    async def get_columns(
        self,
        schema: str,
        table: str,
    ):

        table_ref = (
            f"{self.project_id}.{schema}.{table}"
        )

        table_obj = self.client.get_table(
            table_ref
        )

        return [
            {
                "name": field.name,
                "data_type": field.field_type,
                "mode": field.mode,
            }
            for field in table_obj.schema
        ]

    async def execute_query(
        self,
        query: str,
    ):

        query_job = self.client.query(query)

        results = query_job.result()

        return [
            dict(row)
            for row in results
        ]