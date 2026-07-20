import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import FloodCameraMonitoringApi from './FloodCameraMonitoringApi'
import type { CameraApiItem, CameraListFilters, NeighborhoodDto } from './types/camera'
import { mergeCamerasWithPredictions } from './utils/cameraMapping'
import { parseApiError } from '@/shared'

export const useFloodCameraMonitoringStore = defineStore('flood_monitoring', () => {
  const camerasRaw = ref<CameraApiItem[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const count = ref(0)
  const next = ref<string | null>(null)
  const currentPage = ref(1)
  const activeFilters = ref<CameraListFilters>({})
  const showCameras = ref(true)
  const camerasApi = new FloodCameraMonitoringApi()
  let requestSequence = 0

  const hasMore = computed(() => Boolean(next.value))
  const camerasWithPrediction = computed(() => mergeCamerasWithPredictions(camerasRaw.value, []))

  async function load(filters: CameraListFilters = {}): Promise<void> {
    const sequence = ++requestSequence
    loading.value = true
    error.value = null
    activeFilters.value = { ...filters, page: 1 }
    currentPage.value = 1
    try {
      const response = await camerasApi.getCameras(activeFilters.value)
      if (sequence !== requestSequence) return
      camerasRaw.value = response.results
      count.value = response.count
      next.value = response.next
    } catch (caught: unknown) {
      if (sequence !== requestSequence) return
      error.value = parseApiError(
        caught,
        'Não foi possível carregar as câmeras. Tente novamente em instantes.',
      ).message
      camerasRaw.value = []
      count.value = 0
      next.value = null
    } finally {
      if (sequence === requestSequence) loading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!next.value || loadingMore.value) return
    loadingMore.value = true
    error.value = null
    const page = currentPage.value + 1
    try {
      const response = await camerasApi.getCameras({ ...activeFilters.value, page })
      const known = new Set(camerasRaw.value.map((camera) => camera.id))
      camerasRaw.value.push(...response.results.filter((camera) => !known.has(camera.id)))
      count.value = response.count
      next.value = response.next
      currentPage.value = page
    } catch (caught: unknown) {
      error.value = parseApiError(
        caught,
        'Não foi possível carregar mais câmeras. Tente novamente.',
      ).message
    } finally {
      loadingMore.value = false
    }
  }

  async function getById(id: string): Promise<CameraApiItem | null> {
    const loaded = camerasRaw.value.find((camera) => camera.id === id) ?? null
    const loadedIndex = camerasRaw.value.findIndex((camera) => camera.id === id)
    try {
      const camera = await camerasApi.getCamera(id)
      if (loadedIndex >= 0) camerasRaw.value[loadedIndex] = camera
      else camerasRaw.value.push(camera)
      return camera
    } catch {
      return loaded
    }
  }

  async function getNeighborhoods(): Promise<NeighborhoodDto[]> {
    return camerasApi.getNeighborhoods()
  }

  function setShowCameras(value: boolean) {
    showCameras.value = value
  }

  return {
    camerasRaw,
    camerasWithPrediction,
    loading,
    loadingMore,
    error,
    count,
    hasMore,
    showCameras,
    load,
    loadMore,
    getById,
    getNeighborhoods,
    setShowCameras,
  }
})
