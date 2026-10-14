import axios, { AxiosError } from 'axios'
import { ApiErrorResponse } from '@/types/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vizora_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Helper to extract human-readable error messages from backend responses
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ApiErrorResponse>
    if (err.response?.data?.message) {
      return err.response.data.message
    }
    if (err.response?.data?.errors && err.response.data.errors.length > 0) {
      return err.response.data.errors.map((e) => e.message).join(', ')
    }
    if (typeof err.response?.data === 'string') {
      return err.response.data
    }
    return err.message || 'An unexpected error occurred'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}
