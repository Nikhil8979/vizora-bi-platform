export type DataSourceType = 'postgres' | 'mysql' | 'snowflake' | 'bigquery' | 'redshift'

export interface DataSource {
  id: string
  name: string
  organization_id: string
  description?: string | null
  type: DataSourceType
  configuration: Record<string, any>
}

export interface SqlConfiguration {
  host: string
  port: number
  database: string
  schema?: string
  ssl_mode?: string
}

export interface SnowflakeConfiguration {
  account: string
  warehouse: string
  database: string
  schema: string
  role?: string
}

export interface BigQueryConfiguration {
  project_id: string
  dataset?: string
}

export interface UsernamePasswordCredentials {
  username: string
  password: string
}

export interface ServiceAccountCredentials {
  type: string
  client_email: string
  private_key: string
  token_uri: string
  [key: string]: any
}

export interface CreateDataSourceBase {
  name: string
  description?: string
  credential_secret_id?: string
}

export interface CreatePostgresDataSourcePayload extends CreateDataSourceBase {
  type: 'postgres'
  configuration: SqlConfiguration
  credentials: UsernamePasswordCredentials
}

export interface CreateMysqlDataSourcePayload extends CreateDataSourceBase {
  type: 'mysql'
  configuration: SqlConfiguration
  credentials: UsernamePasswordCredentials
}

export interface CreateRedshiftDataSourcePayload extends CreateDataSourceBase {
  type: 'redshift'
  configuration: SqlConfiguration
  credentials: UsernamePasswordCredentials
}

export interface CreateSnowflakeDataSourcePayload extends CreateDataSourceBase {
  type: 'snowflake'
  configuration: SnowflakeConfiguration
  credentials: UsernamePasswordCredentials
}

export interface CreateBigQueryDataSourcePayload extends CreateDataSourceBase {
  type: 'bigquery'
  configuration: BigQueryConfiguration
  credentials: ServiceAccountCredentials
}

export type CreateDataSourcePayload =
  | CreatePostgresDataSourcePayload
  | CreateMysqlDataSourcePayload
  | CreateRedshiftDataSourcePayload
  | CreateSnowflakeDataSourcePayload
  | CreateBigQueryDataSourcePayload

export interface NamespaceResponse {
  name: string
  metadata: Record<string, any>
}

export interface CollectionResponse {
  name: string
  type?: string | null
  metadata: Record<string, any>
}

export interface FieldResponse {
  name: string
  data_type?: string | null
  nullable?: boolean | null
  metadata: Record<string, any>
}
