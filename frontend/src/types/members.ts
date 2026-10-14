import { User } from './auth'

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'ANALYST' | 'VIEWER'

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: number
  role: OrganizationRole
  user: User
}

export interface InviteMemberPayload {
  email: string
  role: OrganizationRole
}

export interface InviteMemberResponse {
  id: string
  organization_id: string
  user_id: number
}
