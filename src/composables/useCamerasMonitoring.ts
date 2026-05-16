import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'
import type { CameraWithPrediction } from '@/types/predictions'

export function useCamerasMonitoring() {
  const store = useFloodCameraMonitoringStore()
  const intervalMs = 60000

  onMounted(async () => {
    await store.load()
    store.startPolling(intervalMs)
  })

  onBeforeUnmount(() => {
    store.stopPolling()
  })

  const items = computed<CameraWithPrediction[]>(() => store.camerasWithPrediction)

  const statusCounters = computed(() => {
    let active = 0
    let offline = 0
    for (const cam of items.value) {
      if (cam.status === 'ACTIVE') active++
      else if (cam.status === 'OFFLINE') offline++
    }
    return { active, offline }
  })

  return {
    items,
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    refresh: store.refreshPredictions,
    startPolling: store.startPolling,
    stopPolling: store.stopPolling,
    statusCounters,
  }
}
