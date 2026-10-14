import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from './api'
import { InviteMemberPayload } from '@/types/members'
import { getErrorMessage } from '@/lib/api'

export function useOrganizationMembersQuery(organizationId?: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['members', organizationId, page, limit],
    queryFn: () => {
      if (!organizationId) throw new Error('Organization ID is required')
      return membersApi.getMembers(organizationId, page, limit)
    },
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
  })
}

export function useInviteMemberMutation(
  organizationId?: string,
  options?: {
    onSuccess?: () => void
    onError?: (errorMessage: string) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: InviteMemberPayload) => {
      if (!organizationId) throw new Error('No active organization selected')
      return membersApi.inviteMember(organizationId, payload)
    },
    onSuccess: () => {
      // Invalidate members query to trigger instant UI refresh
      queryClient.invalidateQueries({ queryKey: ['members', organizationId] })
      options?.onSuccess?.()
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      options?.onError?.(message)
    },
  })
}
