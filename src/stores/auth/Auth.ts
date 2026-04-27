// import { computed, reactive } from 'vue'
// import { defineStore } from 'pinia'
// import { container } from 'tsyringe'

// import { AuthRepository } from '../repositories/AuthRepository'
// import { useAuthStore } from '@/@core/plugins/registered/pinia/auth'
// // Controller state (minimal): only loading is needed for auth flows
// interface IAuthControllerState {
//     loading: boolean
// }

// export const useAuthController = defineStore('authController', () => {
//     const authRepository = container.resolve(AuthRepository)
//     const authStore = useAuthStore()

//     const state = reactive<IAuthControllerState>({
//         loading: false,
//     })

//     const loading = computed(() => state.loading)

//     // AUTH: login (POST /auth/token)
//     const login = async (payload: { email: string; password: string }) => {
//         try {
//             state.loading = true
//             const response = await authRepository.authenticate(payload)
//             const data: any = response?.data ?? response

//             // Try to find a token in common shapes
//             const token: string | undefined =
//                 data?.access || data?.token || data?.jwt || data?.access_token || data?.idToken

//             if (token) {
//                 authStore.login(token)
//             }

//             return data
//         } catch (error) {
//             throw error
//         } finally {
//             state.loading = false
//         }
//     }

//     // AUTH: register (POST /users/register)
//     const register = async (payload: {
//         name: string
//         email: string
//         dateborn: string
//         password: string
//         'password-confirm': string
//     }) => {
//         try {
//             state.loading = true
//             const response = await authRepository.register(payload)
//             const data: any = response?.data ?? response

//             // Some backends return token on registration; if so, persist it
//             const token: string | undefined =
//                 data?.access || data?.token || data?.jwt || data?.access_token || data?.idToken
//             if (token) {
//                 authStore.login(token)
//             }

//             return data
//         } catch (error) {
//             throw error
//         } finally {
//             state.loading = false
//         }
//     }

//     const logout = () => {
//         authStore.logout()
//     }

//     return {
//         loading,
//         // auth
//         login,
//         register,
//         logout,
//     }
// })
