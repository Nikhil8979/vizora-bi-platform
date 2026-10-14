import { api } from '@/lib/api'
import { Organization, ApiResponse } from '@/types/auth'

export const organizationsApi = {
  getOrganizations: async (): Promise<Organization[]> => {
    const response = await api.get<ApiResponse<Organization[]>>('/api/v1/organizations/')
    return response.data.data
  },
}
