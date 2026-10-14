import { api } from '@/lib/api'
import { ApiResponse } from '@/types/auth'
import { QueryDefinition, QueryResultData, normalizeQueryResult } from './types'

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
}
