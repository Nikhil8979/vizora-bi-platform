import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from './api'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

export function useOrganizationsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setOrganizations = useAuthStore((state) => state.setOrganizations)

  const query = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.getOrganizations,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  })

  // Sync fresh organizations from backend into Zustand global store
  useEffect(() => {
    if (query.data && Array.isArray(query.data)) {
      setOrganizations(query.data)
    }
  }, [query.data, setOrganizations])

  return query
}
