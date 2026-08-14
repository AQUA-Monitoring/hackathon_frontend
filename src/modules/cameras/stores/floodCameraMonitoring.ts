import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import FloodCameraMonitoringApi from '../services/FloodCameraMonitoring'
import type {
  CameraCatalogFilters,
  CameraDetail,
  CameraSummary,
  NearbyCamerasPage,
  NearbyCamerasQuery,
} from '../types/camera'
import {
  camerasToGeoJson,
  mapCameraDetail,
  mapCameraSummary,
  mapNearbyCamera,
} from '@/utils/cameraMapping'

const CATALOG_FRESHNESS_MS = 60_000

const errorMessage = (caught: unknown, fallback: string): string =>
  caught instanceof Error && caught.message ? caught.message : fallback

export const useFloodCameraMonitoringStore = defineStore('flood_monitoring', () => {
  const summariesById = ref<Record<string, CameraSummary>>({})
  const summaryIds = ref<string[]>([])
  const detailsById = ref<Record<string, CameraDetail>>({})
  const nearbyByOriginId = ref<Record<string, NearbyCamerasPage>>({})
  const catalogFilters = ref<CameraCatalogFilters>({
    administrative_status: 'ACTIVE',
    ordering: 'operational',
  })

  const catalogLoading = ref(false)
  const catalogError = ref<string | null>(null)
  const detailLoadingById = ref<Record<string, boolean>>({})
  const detailErrorById = ref<Record<string, string | null>>({})
  const nearbyLoadingByOriginId = ref<Record<string, boolean>>({})
  const nearbyErrorByOriginId = ref<Record<string, string | null>>({})
  const lastSuccessfulAt = ref<number | null>(null)
  const detailLastSuccessfulAtById = ref<Record<string, number>>({})
  const showCameras = ref(true)

  const camerasApi = new FloodCameraMonitoringApi()
  let catalogInFlight: Promise<void> | null = null
  const detailInFlight = new Map<string, Promise<CameraDetail | null>>()
  const nearbyInFlight = new Map<string, Promise<NearbyCamerasPage | null>>()
  const pollingConsumers = new Map<symbol, number>()
  let pollingTimer: number | null = null

  const allCameraSummaries = computed(() =>
    summaryIds.value.flatMap((id) => {
      const camera = summariesById.value[id]
      return camera ? [camera] : []
    }),
  )
  const cameraSummaries = computed(() => allCameraSummaries.value)
  const cameraGeoJson = computed(() => camerasToGeoJson(cameraSummaries.value))

  async function loadCatalog(force = false): Promise<void> {
    if (catalogInFlight) return catalogInFlight
    if (
      !force &&
      lastSuccessfulAt.value !== null &&
      Date.now() - lastSuccessfulAt.value < CATALOG_FRESHNESS_MS
    ) {
      return
    }

    catalogInFlight = (async () => {
      catalogLoading.value = true
      catalogError.value = null
      try {
        const dtos = await camerasApi.getAllCameras({ ...catalogFilters.value })
        const summaries: Record<string, CameraSummary> = {}
        const ids: string[] = []
        for (const dto of dtos) {
          const camera = mapCameraSummary(dto)
          if (!summaries[camera.id]) ids.push(camera.id)
          summaries[camera.id] = camera
        }
        summariesById.value = summaries
        summaryIds.value = ids
        lastSuccessfulAt.value = Date.now()
      } catch (caught: unknown) {
        catalogError.value = errorMessage(
          caught,
          'Não foi possível carregar o catálogo de câmeras.',
        )
      } finally {
        catalogLoading.value = false
      }
    })()

    try {
      await catalogInFlight
    } finally {
      catalogInFlight = null
    }
  }

  async function loadCameraDetail(id: string, force = false): Promise<CameraDetail | null> {
    const cached = detailsById.value[id] ?? null
    const completedAt = detailLastSuccessfulAtById.value[id] ?? 0
    if (!force && cached && Date.now() - completedAt < CATALOG_FRESHNESS_MS) return cached

    const currentRequest = detailInFlight.get(id)
    if (currentRequest) return currentRequest

    const request = (async () => {
      detailLoadingById.value = { ...detailLoadingById.value, [id]: true }
      detailErrorById.value = { ...detailErrorById.value, [id]: null }
      try {
        const detail = mapCameraDetail(await camerasApi.getCamera(id))
        detailsById.value = { ...detailsById.value, [id]: detail }
        detailLastSuccessfulAtById.value = {
          ...detailLastSuccessfulAtById.value,
          [id]: Date.now(),
        }
        return detail
      } catch (caught: unknown) {
        detailErrorById.value = {
          ...detailErrorById.value,
          [id]: errorMessage(caught, 'Não foi possível carregar os detalhes da câmera.'),
        }
        return cached
      } finally {
        detailLoadingById.value = { ...detailLoadingById.value, [id]: false }
      }
    })()

    detailInFlight.set(id, request)
    try {
      return await request
    } finally {
      if (detailInFlight.get(id) === request) detailInFlight.delete(id)
    }
  }

  const refreshCatalog = (): Promise<void> => loadCatalog(true)

  async function setCatalogFilters(filters: CameraCatalogFilters): Promise<void> {
    if (catalogInFlight) await catalogInFlight
    catalogFilters.value = {
      administrative_status: 'ACTIVE',
      ordering: 'operational',
      ...filters,
    }
    await loadCatalog(true)
  }

  async function loadNearbyCameras(
    originId: string,
    query: NearbyCamerasQuery = {},
  ): Promise<NearbyCamerasPage | null> {
    const requestKey = JSON.stringify([originId, query.radius_m, query.page, query.page_size])
    const currentRequest = nearbyInFlight.get(requestKey)
    if (currentRequest) return currentRequest

    const request = (async () => {
      nearbyLoadingByOriginId.value = { ...nearbyLoadingByOriginId.value, [originId]: true }
      nearbyErrorByOriginId.value = { ...nearbyErrorByOriginId.value, [originId]: null }
      try {
        const response = await camerasApi.getNearbyCameras(originId, query)
        const page: NearbyCamerasPage = {
          count: response.count,
          next: response.next,
          previous: response.previous,
          ordering: 'distance',
          radiusM: response.radius_m,
          results: response.results.map(mapNearbyCamera),
        }
        nearbyByOriginId.value = { ...nearbyByOriginId.value, [originId]: page }
        return page
      } catch (caught: unknown) {
        nearbyErrorByOriginId.value = {
          ...nearbyErrorByOriginId.value,
          [originId]: errorMessage(caught, 'Não foi possível carregar as câmeras próximas.'),
        }
        return nearbyByOriginId.value[originId] ?? null
      } finally {
        nearbyLoadingByOriginId.value = { ...nearbyLoadingByOriginId.value, [originId]: false }
      }
    })()

    nearbyInFlight.set(requestKey, request)
    try {
      return await request
    } finally {
      if (nearbyInFlight.get(requestKey) === request) nearbyInFlight.delete(requestKey)
    }
  }

  function restartPollingTimer() {
    if (pollingTimer !== null) {
      window.clearInterval(pollingTimer)
      pollingTimer = null
    }
    if (!pollingConsumers.size) return

    const intervalMs = Math.min(...pollingConsumers.values())
    pollingTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void refreshCatalog()
      }
    }, intervalMs)
  }

  function acquirePolling(intervalMs = 60_000): symbol {
    const consumer = Symbol('camera-polling-consumer')
    pollingConsumers.set(consumer, Math.max(5_000, intervalMs))
    restartPollingTimer()
    return consumer
  }

  function releasePolling(consumer: symbol) {
    if (!pollingConsumers.delete(consumer)) return
    restartPollingTimer()
  }

  function setShowCameras(value: boolean) {
    showCameras.value = value
  }

  return {
    summariesById,
    detailsById,
    nearbyByOriginId,
    catalogFilters,
    allCameraSummaries,
    cameraSummaries,
    cameraGeoJson,
    catalogLoading,
    catalogError,
    detailLoadingById,
    detailErrorById,
    nearbyLoadingByOriginId,
    nearbyErrorByOriginId,
    lastSuccessfulAt,
    detailLastSuccessfulAtById,
    showCameras,
    loadCatalog,
    refreshCatalog,
    setCatalogFilters,
    loadCameraDetail,
    loadNearbyCameras,
    acquirePolling,
    releasePolling,
    setShowCameras,
  }
})
