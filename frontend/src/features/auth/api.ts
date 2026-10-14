import { api } from '@/lib/api'
import {
  LoginResponse,
  RegisterResponseData,
  ApiResponse,
  User,
} from '@/types/auth'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  organizationName: string
}

export const authApi = {
  // FastAPI OAuth2PasswordRequestForm expects form urlencoded with username & password
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const formData = new URLSearchParams()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)

    const response = await api.post<LoginResponse>('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  register: async (credentials: RegisterCredentials): Promise<ApiResponse<RegisterResponseData>> => {
    const response = await api.post<ApiResponse<RegisterResponseData>>('/api/v1/auth/register', {
      full_name: credentials.fullName,
      email: credentials.email,
      password: credentials.password,
      confirm_password: credentials.confirmPassword,
      organization_name: credentials.organizationName,
    })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/api/v1/auth/me')
    return response.data.data
  },
}
