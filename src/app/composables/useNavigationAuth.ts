import { computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/modules/auth'

export function useNavigationAuth() {
  const authStore = useAuthStore()

  onMounted(async () => {
    if (authStore.token?.access && !authStore.user) {
      try {
        await authStore.getMe()
      } catch {
        // Authentication failures are handled by the store.
      }
    }
  })

  return reactive({
    isAuthenticated: computed(() => authStore.isAuthenticated),
    userType: computed(() => authStore.user?.type ?? null),
  })
}
