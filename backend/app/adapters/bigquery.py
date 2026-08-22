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

    async def get_namespaces(self):

        datasets = self.client.list_datasets(
            project=self.project_id
        )

        return [
            {
                "name": dataset.dataset_id,
                "metadata": {
                    "project_id": dataset.project,
                },
            }
            for dataset in datasets
        ]

    async def get_collections(
        self,
        namespace: str,
    ):

        tables = self.client.list_tables(
            f"{self.project_id}.{namespace}"
        )

        return [
            {
                "name": table.table_id,
                "type": table.table_type,
                "metadata": {
                    "namespace": namespace,
                },
            }
            for table in tables
        ]

    async def get_fields(
        self,
        namespace: str,
        collection: str,
    ):

        table_ref = (
            f"{self.project_id}.{namespace}.{collection}"
        )

        table_obj = self.client.get_table(
            table_ref
        )

        return [
            {
                "name": field.name,
                "data_type": field.field_type,
                "nullable": field.mode == "NULLABLE",
                "metadata": {
                    "mode": field.mode,
                },
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