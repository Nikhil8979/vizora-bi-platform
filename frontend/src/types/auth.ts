export interface User {
  id: number
  name: string
  email: string
}

export interface Organization {
  id: string
  name: string
  slug?: string | null
}

export interface LoginResponse {
  user: User
  organizations: Organization[]
  access_token: string
  token_type: string
}

export interface RegisterResponseData {
  user: User
  organization: Organization
  role: string
  access_token: string
  token_type: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  code: number
}

export interface ApiErrorResponse {
  message?: string
  code?: number
  errors?: Array<{ field?: string | null; message: string }>
}
