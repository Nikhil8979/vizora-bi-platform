import { api } from '@/lib/api'
import { ApiResponse } from '@/types/auth'
import { QueryDefinition, QueryResultData, normalizeQueryResult } from './types'

export interface SaveQuestionPayload {
  title: string
  description?: string | null
  query_definition: QueryDefinition
  visualization: {
    type: string
    settings?: Record<string, any>
  }
}

export interface SavedQuestion {
  id: string
  organization_id: string
  data_source_id: string
  title: string
  description: string | null
  query_definition: QueryDefinition
  visualization: {
    type: string
    settings?: Record<string, any>
  }
  created_by: number
}

export const queryEngineApi = {
  /**
   * Execute query using the backend query engine endpoint
   * POST /api/v1/query-engine/queries/execute?organization_id={orgId}
   */
  executeQuery: async (
    organizationId: string,
    queryDefinition: QueryDefinition
  ): Promise<QueryResultData> => {
    const response = await api.post<ApiResponse<any>>(
      `/api/v1/query-engine/queries/execute?organization_id=${encodeURIComponent(
        organizationId
      )}`,
      queryDefinition
    )
    return normalizeQueryResult(response.data.data)
  },

  /**
   * Save question definition and visualization configuration
   * POST /api/v1/question/{organization_id}
   */
  saveQuestion: async (
    organizationId: string,
    payload: SaveQuestionPayload
  ): Promise<SavedQuestion> => {
    const response = await api.post<ApiResponse<SavedQuestion>>(
      `/api/v1/question/${encodeURIComponent(organizationId)}`,
      payload
    )
    return response.data.data
  },

  /**
   * Get single question details
   * GET /api/v1/question/{organization_id}/{question_id}
   */
  getQuestion: async (
    organizationId: string,
    questionId: string
  ): Promise<SavedQuestion> => {
    const response = await api.get<ApiResponse<SavedQuestion>>(
      `/api/v1/question/${encodeURIComponent(organizationId)}/${encodeURIComponent(questionId)}`
    )
    return response.data.data
  },

  /**
   * Execute saved question
   * GET /api/v1/question/{organization_id}/{question_id}/execute
   */
  executeQuestion: async (
    organizationId: string,
    questionId: string
  ): Promise<QueryResultData> => {
    const response = await api.get<ApiResponse<any>>(
      `/api/v1/question/${encodeURIComponent(organizationId)}/${encodeURIComponent(questionId)}/execute`
    )
    return normalizeQueryResult(response.data.data)
  },
}
