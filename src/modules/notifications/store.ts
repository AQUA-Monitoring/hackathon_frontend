import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { parseApiError } from '@/shared'
import { notificationsApi } from './api'
import type {
  OperationalAlert,
  OperationalAlertFilters,
  OperationalAlertsPage,
  RegionSubscription,
} from './types'

const emptyPage = (): OperationalAlertsPage => ({
  count: 0,
  next: null,
  previous: null,
  results: [],
})

export const useNotificationsStore = defineStore('notifications', () => {
  const page = ref<OperationalAlertsPage>(emptyPage())
  const filters = ref<OperationalAlertFilters>({ status: '', page: 1 })
  const regionSubscriptions = ref<RegionSubscription[]>([])
  const openTotal = ref(0)
  const loading = ref(false)
  const actionId = ref<string | null>(null)
  const error = ref<string | null>(null)
  const openCount = computed(() => openTotal.value)

  async function loadOpenCount() {
    const openPage = await notificationsApi.listAlerts({ status: 'OPEN_INDICATION', page: 1 })
    openTotal.value = openPage.count
  }

  async function loadAlerts(nextFilters: OperationalAlertFilters = filters.value) {
    loading.value = true
    error.value = null
    filters.value = { ...nextFilters }
    try {
      page.value = await notificationsApi.listAlerts(filters.value)
    } catch (cause) {
      const parsed = parseApiError(cause, 'Não foi possível carregar os alertas operacionais.')
      error.value = parsed.message
      throw parsed
    } finally {
      loading.value = false
    }
  }

  async function runAction(id: string, action: () => Promise<OperationalAlert>) {
    actionId.value = id
    try {
      const updated = await action()
      const index = page.value.results.findIndex((alert) => alert.id === id)
      if (index >= 0) page.value.results[index] = updated
      await loadAlerts(filters.value)
      await loadOpenCount().catch(() => undefined)
      return updated
    } finally {
      actionId.value = null
    }
  }

  const confirm = (id: string, reason?: string) =>
    runAction(id, () => notificationsApi.confirm(id, reason))
  const dismiss = (id: string, reason?: string) =>
    runAction(id, () => notificationsApi.dismiss(id, reason))
  const resolve = (id: string, notifySubscribers: boolean, reason?: string) =>
    runAction(id, () => notificationsApi.resolve(id, notifySubscribers, reason))

  async function loadRegionSubscriptions() {
    regionSubscriptions.value = await notificationsApi.listRegionSubscriptions()
  }

  async function followRegion(regionId: string) {
    await notificationsApi.followRegion(regionId)
    await loadRegionSubscriptions()
  }

  async function unfollowRegion(regionId: string) {
    await notificationsApi.unfollowRegion(regionId)
    await loadRegionSubscriptions()
  }

  return {
    page,
    filters,
    regionSubscriptions,
    loading,
    actionId,
    error,
    openCount,
    loadOpenCount,
    loadAlerts,
    confirm,
    dismiss,
    resolve,
    loadRegionSubscriptions,
    followRegion,
    unfollowRegion,
  }
})
