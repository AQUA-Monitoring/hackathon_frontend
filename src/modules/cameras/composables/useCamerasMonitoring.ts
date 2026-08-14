import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useFloodCameraMonitoringStore } from '../stores/floodCameraMonitoring'

interface CamerasMonitoringOptions {
  autoLoad?: boolean
  polling?: boolean
  pollingIntervalMs?: number
}

export function useCamerasMonitoring(options: CamerasMonitoringOptions = {}) {
  const store = useFloodCameraMonitoringStore()
  let pollingConsumer: symbol | null = null

  onMounted(() => {
    if (options.autoLoad !== false) void store.loadCatalog()
    if (options.polling !== false) {
      pollingConsumer = store.acquirePolling(options.pollingIntervalMs)
    }
  })

  onBeforeUnmount(() => {
    if (pollingConsumer) store.releasePolling(pollingConsumer)
    pollingConsumer = null
  })

  const statusCounters = computed(() => {
    let active = 0
    let offline = 0
    let inactive = 0
    for (const camera of store.allCameraSummaries) {
      if (camera.status === 'ACTIVE') active += 1
      else if (camera.status === 'OFFLINE') offline += 1
      else inactive += 1
    }
    return { active, offline, inactive }
  })

  const cameras = computed(() => store.cameraSummaries)

  return {
    cameras,
    // Alias de leitura para consumidores legados; não executa merge com /predict/all/.
    camerasWithPrediction: cameras,
    summariesById: computed(() => store.summariesById),
    cameraDetailsById: computed(() => store.detailsById),
    nearbyByOriginId: computed(() => store.nearbyByOriginId),
    catalogFilters: computed(() => store.catalogFilters),
    cameraGeoJson: computed(() => store.cameraGeoJson),
    catalogLoading: computed(() => store.catalogLoading),
    catalogError: computed(() => store.catalogError),
    detailLoadingById: computed(() => store.detailLoadingById),
    detailErrorById: computed(() => store.detailErrorById),
    nearbyLoadingByOriginId: computed(() => store.nearbyLoadingByOriginId),
    nearbyErrorByOriginId: computed(() => store.nearbyErrorByOriginId),
    lastSuccessfulAt: computed(() => store.lastSuccessfulAt),
    showCameras: computed(() => store.showCameras),
    statusCounters,
    loadCatalog: store.loadCatalog,
    refreshCatalog: store.refreshCatalog,
    setCatalogFilters: store.setCatalogFilters,
    loadCameraDetail: store.loadCameraDetail,
    loadNearbyCameras: store.loadNearbyCameras,
    setShowCameras: store.setShowCameras,
  }
}
