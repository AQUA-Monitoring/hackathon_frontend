import axios, { type AxiosRequestHeaders } from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'https://api-aqua.michalski.app/api/',
})

api.interceptors.request.use(
  (request) => {
    const authStore = useAuthStore()
    const token = authStore.token?.access || localStorage.getItem('access_token')

    request.headers = {
      Authorization: token ? `Bearer ${token}` : '',
    } as AxiosRequestHeaders

    return request
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      authStore.refreshToken()
    }

    return Promise.reject(error)
  },
)

export default api
