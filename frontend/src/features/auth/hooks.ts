import { useMutation, useQuery } from '@tanstack/react-query'
import { authApi, LoginCredentials, RegisterCredentials } from './api'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage } from '@/lib/api'

export function useLoginMutation(options?: {
  onSuccess?: () => void
  onError?: (errorMsg: string) => void
}) {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        organizations: data.organizations,
        accessToken: data.access_token,
      })
      options?.onSuccess?.()
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      options?.onError?.(message)
    },
  })
}

export function useRegisterMutation(options?: {
  onSuccess?: () => void
  onError?: (errorMsg: string) => void
}) {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (res) => {
      const data = res.data
      setAuth({
        user: data.user,
        organizations: [data.organization],
        accessToken: data.access_token,
      })
      options?.onSuccess?.()
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      options?.onError?.(message)
    },
  })
}

export function useCurrentUserQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}
