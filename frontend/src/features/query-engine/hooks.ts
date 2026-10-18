import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryEngineApi, SaveQuestionPayload, SavedQuestion } from './api'
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

export function useSaveQuestionMutation(
  organizationId?: string,
  options?: {
    onSuccess?: (data: SavedQuestion) => void
    onError?: (error: string) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveQuestionPayload) => {
      if (!organizationId) throw new Error('Organization ID is required')
      return queryEngineApi.saveQuestion(organizationId, payload)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['questions', organizationId] })
      options?.onSuccess?.(data)
    },
    onError: (err) => {
      options?.onError?.(getErrorMessage(err))
    },
  })
}

export function useQuestionQuery(organizationId?: string, questionId?: string) {
  return useQuery({
    queryKey: ['question', organizationId, questionId],
    queryFn: () => {
      if (!organizationId || !questionId) throw new Error('Organization and Question IDs are required')
      return queryEngineApi.getQuestion(organizationId, questionId)
    },
    enabled: Boolean(organizationId && questionId),
  })
}

export function useExecuteQuestionQuery(organizationId?: string, questionId?: string) {
  return useQuery({
    queryKey: ['question-execution', organizationId, questionId],
    queryFn: () => {
      if (!organizationId || !questionId) throw new Error('Organization and Question IDs are required')
      return queryEngineApi.executeQuestion(organizationId, questionId)
    },
    enabled: Boolean(organizationId && questionId),
  })
}
