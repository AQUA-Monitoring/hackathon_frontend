import { computed, onMounted } from 'vue'
import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'
import type { CameraListFilters } from '@/types/camera/camera'

export function useCamerasMonitoring(options: { autoLoad?: boolean } = {}) {
  const store = useFloodCameraMonitoringStore()

  onMounted(async () => {
    if (options.autoLoad === false || store.camerasRaw.length) return
    await store.load()
  })

  const statusCounters = computed(() => {
    let active = 0
    let inactive = 0
    let unavailable = 0
    for (const camera of store.camerasRaw) {
      if (camera.administrative_status === 'ACTIVE') active += 1
      else inactive += 1
      if (camera.operational.stream.status === 'UNAVAILABLE') unavailable += 1
    }
    return { active, inactive, unavailable }
  })

  const load = (filters?: CameraListFilters) => store.load(filters)

  return {
    cameras: computed(() => store.camerasRaw),
    camerasWithPrediction: computed(() => store.camerasWithPrediction),
    loading: computed(() => store.loading),
    loadingMore: computed(() => store.loadingMore),
    error: computed(() => store.error),
    count: computed(() => store.count),
    hasMore: computed(() => store.hasMore),
    load,
    loadMore: store.loadMore,
    getById: store.getById,
    getNeighborhoods: store.getNeighborhoods,
    statusCounters,
  }
}
