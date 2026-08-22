
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.data_sources import DataSourceType


class CreateDataSourceRequest(BaseModel):
    name: str
    description: str | None = None
    type: DataSourceType
    configuration: dict
    credentials:dict | None = None
    credential_secret_id: str | None = None


class CreateDataSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    description: str | None = None
    type: DataSourceType
    configuration: dict

class DataSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    description: str | None = None
    type: DataSourceType
    configuration: dict