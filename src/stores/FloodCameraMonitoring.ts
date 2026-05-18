import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import FloodCameraMonitoringApi from '@/services/FloodCameraMonitoring'
import FloodPredictionsApi from '@/services/FloodPredictions'
import type { CameraApiItem } from '../types/camera'
import type { PredictionApiItem } from '../types/predictions'
import { mergeCamerasWithPredictions } from '@/utils/cameraMapping'

export const useFloodCameraMonitoringStore = defineStore('flood_monitoring', () => {
  const camerasRaw = ref<CameraApiItem[]>([])
  const predictionsRaw = ref<PredictionApiItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const camerasApi = new FloodCameraMonitoringApi()
  const predsApi = new FloodPredictionsApi()

  let inFlight: Promise<void> | null = null
  let pollingTimer: number | null = null

  const load = async (): Promise<void> => {
    if (inFlight) return inFlight

    inFlight = (async () => {
      loading.value = true
      error.value = null

      const [camsRes, predsRes] = await Promise.allSettled([
        camerasApi.getAllCameras(),
        predsApi.getAllFloodPredictions(),
      ])

      if (camsRes.status === 'fulfilled') {
        camerasRaw.value = camsRes.value?.results ?? []
      } else {
        error.value = camsRes.reason?.message ?? 'Erro ao carregar câmeras'
        loading.value = false
        return
      }

      if (predsRes.status === 'fulfilled') {
        predictionsRaw.value = predsRes.value?.results ?? []
      }

      loading.value = false
    })()

    try {
      await inFlight
    } finally {
      inFlight = null
    }
  }

  const camerasWithPrediction = computed(() =>
    mergeCamerasWithPredictions(camerasRaw.value, predictionsRaw.value),
  )

  const refreshPredictions = async (): Promise<void> => {
    try {
      const res = await predsApi.getAllFloodPredictions()
      predictionsRaw.value = res?.results ?? []
    } catch (err: any) {
      error.value = err?.message ?? 'Predições indisponíveis'
    }
  }

  const stopPolling = () => {
    if (pollingTimer !== null) {
      window.clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  const startPolling = (intervalMs = 60000) => {
    stopPolling()
    pollingTimer = window.setInterval(() => {
      refreshPredictions().catch(() => {})
    }, intervalMs)
  }

  return {
    camerasRaw,
    predictionsRaw,
    loading,
    error,
    camerasWithPrediction,
    load,
    refreshPredictions,
    startPolling,
    stopPolling,
  }
})
