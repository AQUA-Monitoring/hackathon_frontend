import api from '@/plugins/axios'

export default class AuthApi {
  async loginUser(user) {
    const { data } = await api.post('/token/', user)
    return data
  }

  async getMe() {
    const { data } = await api.get('/usuarios/me/')
    return data
  }
  async refreshToken(token: string) {
    const { data } = await api.post('/token/refresh/', { refresh: token })
    return data
  }
}
