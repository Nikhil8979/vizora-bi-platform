import { create } from 'zustand'
import { User, Organization } from '@/types/auth'

interface AuthState {
  user: User | null
  organizations: Organization[]
  currentOrganization: Organization | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (payload: {
    user: User
    organizations?: Organization[]
    accessToken: string
  }) => void
  setOrganizations: (organizations: Organization[]) => void
  setCurrentOrganization: (org: Organization) => void
  logout: () => void
}

const STORAGE_KEY_TOKEN = 'vizora_access_token'
const STORAGE_KEY_USER = 'vizora_user'
const STORAGE_KEY_ORGS = 'vizora_orgs'
const STORAGE_KEY_ACTIVE_ORG = 'vizora_active_org'

const getInitialState = () => {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    const storedUser = localStorage.getItem(STORAGE_KEY_USER)
    const storedOrgs = localStorage.getItem(STORAGE_KEY_ORGS)
    const storedActiveOrg = localStorage.getItem(STORAGE_KEY_ACTIVE_ORG)

    if (token && storedUser) {
      const user: User = JSON.parse(storedUser)
      const organizations: Organization[] = storedOrgs ? JSON.parse(storedOrgs) : []
      const activeOrg: Organization | null = storedActiveOrg
        ? JSON.parse(storedActiveOrg)
        : organizations[0] || null

      return {
        user,
        organizations,
        currentOrganization: activeOrg,
        accessToken: token,
        isAuthenticated: true,
      }
    }
  } catch (e) {
    console.error('Failed to restore auth from localStorage', e)
  }

  return {
    user: null,
    organizations: [],
    currentOrganization: null,
    accessToken: null,
    isAuthenticated: false,
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialState(),

  setAuth: ({ user, organizations = [], accessToken }) => {
    const activeOrg = organizations[0] || null
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, accessToken)
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
      localStorage.setItem(STORAGE_KEY_ORGS, JSON.stringify(organizations))
      if (activeOrg) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ORG, JSON.stringify(activeOrg))
      }
    } catch (e) {
      console.error('Failed to save auth to localStorage', e)
    }

    set({
      user,
      organizations,
      currentOrganization: activeOrg,
      accessToken,
      isAuthenticated: true,
    })
  },

  setOrganizations: (organizations: Organization[]) => {
    const current = get().currentOrganization
    // Keep current if still in list, otherwise select first
    const stillValid = current && organizations.some((o) => o.id === current.id)
    const activeOrg = stillValid ? current : organizations[0] || null

    try {
      localStorage.setItem(STORAGE_KEY_ORGS, JSON.stringify(organizations))
      if (activeOrg) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ORG, JSON.stringify(activeOrg))
      }
    } catch (e) {
      console.error('Failed to save orgs to localStorage', e)
    }

    set({
      organizations,
      currentOrganization: activeOrg,
    })
  },

  setCurrentOrganization: (org) => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ORG, JSON.stringify(org))
    } catch (e) {
      console.error('Failed to save active org to localStorage', e)
    }
    set({ currentOrganization: org })
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN)
      localStorage.removeItem(STORAGE_KEY_USER)
      localStorage.removeItem(STORAGE_KEY_ORGS)
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ORG)
    } catch (e) {
      console.error('Failed to clear auth from localStorage', e)
    }

    set({
      user: null,
      organizations: [],
      currentOrganization: null,
      accessToken: null,
      isAuthenticated: false,
    })
  },
}))
