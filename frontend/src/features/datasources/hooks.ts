import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { datasourcesApi } from './api'
import { CreateDataSourcePayload } from '@/types/datasource'
import { getErrorMessage } from '@/lib/api'

export function useDataSourcesQuery(organizationId?: string) {
  return useQuery({
    queryKey: ['datasources', organizationId],
    queryFn: () => {
      if (!organizationId) throw new Error('Organization ID is required')
      return datasourcesApi.getDataSources(organizationId)
    },
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
  })
}

export function useDataSourceByIdQuery(organizationId?: string, dataSourceId?: string) {
  return useQuery({
    queryKey: ['datasource', organizationId, dataSourceId],
    queryFn: () => {
      if (!organizationId || !dataSourceId) throw new Error('Organization & DataSource ID required')
      return datasourcesApi.getDataSourceById(organizationId, dataSourceId)
    },
    enabled: Boolean(organizationId && dataSourceId),
  })
}

export function useCreateDataSourceMutation(
  organizationId?: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: string) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDataSourcePayload) => {
      if (!organizationId) throw new Error('Organization ID is required')
      return datasourcesApi.createDataSource(organizationId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasources', organizationId] })
      options?.onSuccess?.()
    },
    onError: (err) => {
      options?.onError?.(getErrorMessage(err))
    },
  })
}

export function useDeleteDataSourceMutation(
  organizationId?: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: string) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dataSourceId: string) => {
      if (!organizationId) throw new Error('Organization ID is required')
      return datasourcesApi.deleteDataSource(organizationId, dataSourceId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasources', organizationId] })
      options?.onSuccess?.()
    },
    onError: (err) => {
      options?.onError?.(getErrorMessage(err))
    },
  })
}

export function useTestConnectionMutation(
  organizationId?: string,
  options?: {
    onSuccess?: (result: any) => void
    onError?: (error: string) => void
  }
) {
  return useMutation({
    mutationFn: (dataSourceId: string) => {
      if (!organizationId) throw new Error('Organization ID is required')
      return datasourcesApi.testConnection(organizationId, dataSourceId)
    },
    onSuccess: (result) => {
      options?.onSuccess?.(result)
    },
    onError: (err) => {
      options?.onError?.(getErrorMessage(err))
    },
  })
}

export function useNamespacesQuery(organizationId?: string, dataSourceId?: string) {
  return useQuery({
    queryKey: ['namespaces', organizationId, dataSourceId],
    queryFn: () => {
      if (!organizationId || !dataSourceId) throw new Error('IDs required')
      return datasourcesApi.getNamespaces(organizationId, dataSourceId)
    },
    enabled: Boolean(organizationId && dataSourceId),
    staleTime: 60 * 1000,
  })
}

export function useCollectionsQuery(
  organizationId?: string,
  dataSourceId?: string,
  namespaceName?: string
) {
  return useQuery({
    queryKey: ['collections', organizationId, dataSourceId, namespaceName],
    queryFn: () => {
      if (!organizationId || !dataSourceId || !namespaceName) throw new Error('IDs required')
      return datasourcesApi.getCollections(organizationId, dataSourceId, namespaceName)
    },
    enabled: Boolean(organizationId && dataSourceId && namespaceName),
    staleTime: 5 * 1000,
    refetchOnMount: 'always',
  })
}

export function useFieldsQuery(
  organizationId?: string,
  dataSourceId?: string,
  namespaceName?: string,
  collectionName?: string
) {
  return useQuery({
    queryKey: ['fields', organizationId, dataSourceId, namespaceName, collectionName],
    queryFn: () => {
      if (!organizationId || !dataSourceId || !namespaceName || !collectionName) {
        throw new Error('IDs required')
      }
      return datasourcesApi.getFields(organizationId, dataSourceId, namespaceName, collectionName)
    },
    enabled: Boolean(organizationId && dataSourceId && namespaceName && collectionName),
    staleTime: 60 * 1000,
  })
}
