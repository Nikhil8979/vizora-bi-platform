import { api } from '@/lib/api'
import { ApiResponse } from '@/types/auth'
import {
  OrganizationMember,
  InviteMemberPayload,
  InviteMemberResponse,
} from '@/types/members'

export const membersApi = {
  getMembers: async (organizationId: string, page = 1, limit = 50): Promise<OrganizationMember[]> => {
    const response = await api.get<ApiResponse<OrganizationMember[]>>(
      `/api/v1/organizations/${organizationId}/members`,
      {
        params: { page, limit },
      }
    )
    return response.data.data
  },

  inviteMember: async (
    organizationId: string,
    payload: InviteMemberPayload
  ): Promise<InviteMemberResponse> => {
    const response = await api.post<ApiResponse<InviteMemberResponse>>(
      `/api/v1/organizations/${organizationId}/members/invite`,
      payload
    )
    return response.data.data
  },
}
