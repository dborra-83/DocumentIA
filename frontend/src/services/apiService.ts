import axios, { AxiosInstance, AxiosError } from 'axios'
import { apiUrl } from '../config'
import { AuthService } from './authService'
import type { ApiError } from '../types'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AuthService.getIdToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          try {
            await AuthService.refreshSession()
            // Retry the original request
            if (error.config) {
              return this.client.request(error.config)
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await AuthService.logout()
            window.location.href = '/login'
          }
        }
        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error
      const data = error.response.data as { message?: string; error?: string }
      return {
        message: data.message || data.error || 'An error occurred',
        code: error.response.status.toString(),
        details: error.response.data,
      }
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'No response from server. Please check your connection.',
        code: 'NETWORK_ERROR',
      }
    } else {
      // Error setting up request
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'REQUEST_ERROR',
      }
    }
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data)
    return response.data
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url)
    return response.data
  }

  async getAdminConfig(): Promise<{ currentModel: string; availableModels: Array<{ id: string; name: string; description: string }> }> {
    return this.get('/admin/config')
  }

  async updateAdminModel(modelId: string): Promise<{ message: string; modelId: string }> {
    return this.put('/admin/config', { modelId })
  }

  async uploadFile(url: string, file: File, onProgress?: (progress: number) => void): Promise<void> {    await axios.put(url, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  }
}

export const apiService = new ApiService()
