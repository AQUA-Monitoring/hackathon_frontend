import { computed, ref } from 'vue'
import { notificationsApi } from './api'
import type { PushUiState } from './types'

function decodeApplicationServerKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const bytes = window.atob(base64)
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0))
}

export function useWebPush() {
  const state = ref<PushUiState>('prompt')
  const error = ref<string | null>(null)
  const subscription = ref<PushSubscription | null>(null)
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  const active = computed(() => state.value === 'subscribed')

  async function refresh() {
    error.value = null
    if (!supported) {
      state.value = 'unsupported'
      return
    }
    try {
      const config = await notificationsApi.getPushConfig()
      if (!config.enabled || !config.application_server_key) {
        state.value = 'disabled_by_server'
        return
      }
      if (Notification.permission === 'denied') {
        state.value = 'denied'
        return
      }
      const registration = await navigator.serviceWorker.ready
      subscription.value = await registration.pushManager.getSubscription()
      state.value = subscription.value ? 'subscribed' : 'prompt'
    } catch {
      state.value = 'temporary_error'
      error.value = 'Não foi possível consultar as notificações neste momento.'
    }
  }

  async function subscribe() {
    if (!supported) return refresh()
    state.value = 'subscribing'
    error.value = null
    try {
      const config = await notificationsApi.getPushConfig()
      if (!config.enabled || !config.application_server_key) {
        state.value = 'disabled_by_server'
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        state.value = 'denied'
        return
      }
      const registration = await navigator.serviceWorker.ready
      subscription.value = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeApplicationServerKey(config.application_server_key),
      })
      await notificationsApi.registerPush(subscription.value.toJSON())
      state.value = 'subscribed'
    } catch {
      state.value = 'temporary_error'
      error.value = 'Falha temporária ao ativar as notificações. Tente novamente.'
    }
  }

  async function unsubscribe() {
    if (!subscription.value) return refresh()
    state.value = 'subscribing'
    try {
      const endpoint = subscription.value.endpoint
      await notificationsApi.removePush(endpoint)
      await subscription.value.unsubscribe()
      subscription.value = null
      state.value = 'prompt'
    } catch {
      state.value = 'temporary_error'
      error.value = 'Não foi possível desativar as notificações neste momento.'
    }
  }

  return { state, error, active, refresh, subscribe, unsubscribe }
}
