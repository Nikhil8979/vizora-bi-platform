import json

from google.cloud import secretmanager
from app.core.config import get_app_config


class SecretService:

    def __init__(self):
        self.client = secretmanager.SecretManagerServiceClient()
        self.project_id = get_app_config().gcp_project_id

    async def create_secret(
        self,
        secret_id: str,
        credentials: dict,
    ):
        parent = f"projects/{self.project_id}"
        print(f"Credentials: {credentials}")
        secret = self.client.create_secret(
            request={
                "parent": parent,
                "secret_id": secret_id,
                "secret": {
                    "replication": {
                        "automatic": {}
                    }
                },
            }
        )

        payload = json.dumps(credentials).encode("utf-8")

        self.client.add_secret_version(
            request={
                "parent": secret.name,
                "payload": {
                    "data": payload
                },
            }
        )

        return secret.name


    def get_secret(
        self,
        secret_name: str,
    ) -> dict:

        secret_name = (
        f"{secret_name}/versions/latest"
        )
        response = self.client.access_secret_version(
            request={
                "name": secret_name
            }
        )

        payload = response.payload.data.decode("UTF-8")

        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Secret payload is not valid JSON: {secret_name}") from exc

        if not isinstance(parsed, dict) or not parsed:
            raise ValueError(f"Secret payload is empty or not an object: {secret_name}")

        return parsed

    async def delete_secret(self, secret_name: str) -> None:
        self.client.delete_secret(
            request={
                "name": secret_name
            }
        )