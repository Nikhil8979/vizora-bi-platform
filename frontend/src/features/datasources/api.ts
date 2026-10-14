import { api } from '@/lib/api'
import { ApiResponse } from '@/types/auth'
import {
  DataSource,
  CreateDataSourcePayload,
  NamespaceResponse,
  CollectionResponse,
  FieldResponse,
} from '@/types/datasource'

export const datasourcesApi = {
  getDataSources: async (organizationId: string): Promise<DataSource[]> => {
    const response = await api.get<ApiResponse<DataSource[]>>(
      `/api/v1/datasources/${organizationId}/`
    )
    return response.data.data
  },

  getDataSourceById: async (
    organizationId: string,
    dataSourceId: string
  ): Promise<DataSource> => {
    const response = await api.get<ApiResponse<DataSource>>(
      `/api/v1/datasources/${organizationId}/${dataSourceId}/`
    )
    return response.data.data
  },

  createDataSource: async (
    organizationId: string,
    payload: CreateDataSourcePayload
  ): Promise<DataSource> => {
    const response = await api.post<ApiResponse<DataSource>>(
      `/api/v1/datasources/${organizationId}/`,
      payload
    )
    return response.data.data
  },

  deleteDataSource: async (
    organizationId: string,
    dataSourceId: string
  ): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/api/v1/datasources/${organizationId}/${dataSourceId}/`
    )
  },

  testConnection: async (
    organizationId: string,
    dataSourceId: string
  ): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(
      `/api/v1/datasources/${organizationId}/${dataSourceId}/test-connection/`
    )
    return response.data.data
  },

  getNamespaces: async (
    organizationId: string,
    dataSourceId: string
  ): Promise<NamespaceResponse[]> => {
    const response = await api.get<ApiResponse<NamespaceResponse[]>>(
      `/api/v1/datasources/${organizationId}/${dataSourceId}/namespaces/`
    )
    return response.data.data
  },

  getCollections: async (
    organizationId: string,
    dataSourceId: string,
    namespaceName: string
  ): Promise<CollectionResponse[]> => {
    const response = await api.get<ApiResponse<CollectionResponse[]>>(
      `/api/v1/datasources/${organizationId}/${dataSourceId}/namespaces/${encodeURIComponent(namespaceName)}/collections/`
    )
    return response.data.data
  },

  getFields: async (
    organizationId: string,
    dataSourceId: string,
    namespaceName: string,
    collectionName: string
  ): Promise<FieldResponse[]> => {
    const response = await api.get<ApiResponse<FieldResponse[]>>(
      `/api/v1/datasources/${organizationId}/${dataSourceId}/namespaces/${encodeURIComponent(namespaceName)}/collections/${encodeURIComponent(collectionName)}/fields/`
    )
    return response.data.data
  },
}
