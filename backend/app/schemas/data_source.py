
from typing import Annotated, Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.data_sources import DataSourceType


class BaseDataSourceRequest(BaseModel):
    name: str
    description: str | None = None
    credential_secret_id: str | None = None


class BigQueryConfiguration(BaseModel):
    project_id: str
    dataset: str | None = None


class ServiceAccountCredentials(BaseModel):
    model_config = ConfigDict(extra="allow")

    type: str
    client_email: str
    private_key: str
    token_uri: str


class SqlConfiguration(BaseModel):
    host: str
    port: int
    database: str
    schema: str | None = None
    ssl_mode: str | None = None


class UsernamePasswordCredentials(BaseModel):
    model_config = ConfigDict(extra="allow")

    username: str
    password: str


class SnowflakeConfiguration(BaseModel):
    account: str
    warehouse: str
    database: str
    schema: str
    role: str | None = None


class BigQueryCreateDataSourceRequest(BaseDataSourceRequest):
    type: Literal[DataSourceType.BIGQUERY]
    configuration: BigQueryConfiguration
    credentials: ServiceAccountCredentials


class PostgresCreateDataSourceRequest(BaseDataSourceRequest):
    type: Literal[DataSourceType.POSTGRES]
    configuration: SqlConfiguration
    credentials: UsernamePasswordCredentials


class MysqlCreateDataSourceRequest(BaseDataSourceRequest):
    type: Literal[DataSourceType.MYSQL]
    configuration: SqlConfiguration
    credentials: UsernamePasswordCredentials


class RedshiftCreateDataSourceRequest(BaseDataSourceRequest):
    type: Literal[DataSourceType.REDSHIFT]
    configuration: SqlConfiguration
    credentials: UsernamePasswordCredentials


class SnowflakeCreateDataSourceRequest(BaseDataSourceRequest):
    type: Literal[DataSourceType.SNOWFLAKE]
    configuration: SnowflakeConfiguration
    credentials: UsernamePasswordCredentials


CreateDataSourceRequest = Annotated[
    BigQueryCreateDataSourceRequest
    | PostgresCreateDataSourceRequest
    | MysqlCreateDataSourceRequest
    | RedshiftCreateDataSourceRequest
    | SnowflakeCreateDataSourceRequest,
    Field(discriminator="type"),
]


class CreateDataSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    description: str | None = None
    type: DataSourceType
    configuration: dict[str, Any]

class DataSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    description: str | None = None
    type: DataSourceType
    configuration: dict[str, Any]


class NamespaceResponse(BaseModel):
    name: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class CollectionResponse(BaseModel):
    name: str
    type: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class FieldResponse(BaseModel):
    name: str
    data_type: str | None = None
    nullable: bool | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)