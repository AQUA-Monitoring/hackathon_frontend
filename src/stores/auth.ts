import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '@/router'
import { toast, type ToastOptions } from 'vue3-toastify'
import AuthApi from '@/services/Auth'
import { useLoadingStore } from './loading'
import type { IToken, IUser } from '@/types/auth'

const authServiceClient = new AuthApi()

export const useAuthStore = defineStore('auth', () => {
  const loadingStore = useLoadingStore()
  const user = ref<IUser | null>(null)
  const token = ref<IToken | null>({
    access: localStorage.getItem('access_token') ?? '',
    refresh: localStorage.getItem('refresh_token') ?? '',
  })
  const isAuthenticated = ref(!!localStorage.getItem('access_token'))

  function persistTokens(tokens: IToken) {
    token.value = tokens
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
  }

  async function loginUser(authData) {
    loadingStore.start()
    try {
      const response = await authServiceClient.loginUser(authData)

      toast.success('Sessão iniciada com sucesso!', {
        autoClose: 5000,
        position: toast.POSITION.TOP_RIGHT,
        icon: true,
      } as ToastOptions)

      isAuthenticated.value = true
      persistTokens(response)
      await getMe()
    } catch (error: unknown) {
      console.error('Erro detalhado:', error)
    } finally {
      loadingStore.stop()
    }
  }

  async function getMe() {
    try {
      const response = await authServiceClient.getMe()
      user.value = response
      isAuthenticated.value = true
    } catch (error: unknown) {
      console.error('Erro ao buscar usuário:', error)
    }
  }

  async function refreshToken() {
    const refresh = token.value?.refresh ?? localStorage.getItem('refresh_token')

    if (refresh) {
      const response = await authServiceClient.refreshToken(refresh)
      token.value = response
    } else {
      logout()
    }
  }

  async function logout() {
    token.value = null
    isAuthenticated.value = false
    user.value = null

    localStorage.clear()

    toast.success('Sessão encerrada com sucesso!', {
      autoClose: 5000,
      position: toast.POSITION.TOP_RIGHT,
      icon: true,
    } as ToastOptions)

    router.push('/login')
  }

  return {
    user,
    token,
    isAuthenticated,
    loginUser,
    getMe,
    refreshToken,
    logout,
  }
})
