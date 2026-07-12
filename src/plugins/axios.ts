import axios, { type AxiosRequestHeaders } from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'http://100.101.199.33:8001/api/',
  // baseURL: import.meta.env.VITE_BASE_URL || 'https://api-aqua.michalski.app/api/',
})

api.interceptors.request.use(
  (request) => {
    const authStore = useAuthStore()
    const token = authStore.token?.access || localStorage.getItem('access_token')

    request.headers = {
      ...request.headers,
      Authorization: token ? `Bearer ${token}` : '',
    } as AxiosRequestHeaders

    return request
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config
    const requestUrl = originalRequest?.url ?? ''
    const isAuthEndpoint =
      requestUrl.includes('/auth/token/') || requestUrl.includes('/auth/token/refresh/')

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      try {
        await authStore.refreshToken()
        const token = authStore.token?.access || localStorage.getItem('access_token')
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: token ? `Bearer ${token}` : '',
        } as AxiosRequestHeaders
        return api(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
