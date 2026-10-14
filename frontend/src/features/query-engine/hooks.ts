import { useMutation } from '@tanstack/react-query'
import { queryEngineApi } from './api'
import { QueryDefinition, QueryResultData } from './types'
import { getErrorMessage } from '@/lib/api'

export function useExecuteQueryMutation(
  organizationId?: string,
  options?: {
    onSuccess?: (data: QueryResultData) => void
    onError?: (error: string) => void
  }
) {
  return useMutation({
    mutationFn: (queryDefinition: QueryDefinition) => {
      if (!organizationId) throw new Error('Organization ID is required')
      return queryEngineApi.executeQuery(organizationId, queryDefinition)
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (err) => {
      options?.onError?.(getErrorMessage(err))
    },
  })
}
