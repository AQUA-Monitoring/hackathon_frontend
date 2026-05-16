import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import FloodCameraMonitoringApi from '@/services/FloodCameraMonitoring'
import FloodPredictionsApi from '@/services/FloodPredictions'
import type { CameraApiItem, ICamera } from '../types/camera'
import type { PredictionApiItem, PredictionData } from '../types/predictions'

export const useFloodCameraMonitoringStore = defineStore('flood_monitoring', () => {
  const camerasRaw = ref<CameraApiItem[]>([])
  const predictionsRaw = ref<PredictionApiItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const camerasApi = new FloodCameraMonitoringApi()
  const predsApi = new FloodPredictionsApi()

  let inFlight: Promise<void> | null = null
  let pollingTimer: number | null = null

  const toCamera = (c: CameraApiItem): ICamera => {
    return {
      id: c.id,
      name: c.description ?? 'Câmera',
      hls_url: c.video_hls ?? '',
      embed_url: c.video_embed ?? undefined,
      flood_percentage: 0,
      status: c.status,
      link: '/cameras',
      latitude: Number.isFinite(c.latitude) ? c.latitude : 0,
      longitude: Number.isFinite(c.longitude) ? c.longitude : 0,
    }
  }

  const toPrediction = (item: PredictionApiItem): PredictionData => {
    return {
      is_flooded: item.is_flooded ?? false,
      confidence: item.confidence ?? 0,
      probabilities: {
        normal: item.probabilities?.normal ?? 0,
        flooded: item.probabilities?.flooded ?? 0,
        medium: item.probabilities?.medium,
      },
    }
  }

  const allowedStatus = new Set(['ACTIVE', 'OFFLINE'])
  const displayFlood = (prediction?: PredictionData) => {
    if (!prediction) return 0
    const v = prediction.probabilities?.flooded
    if (typeof v !== 'number' || Number.isNaN(v)) return 0
    return Math.min(100, Math.max(0, v))
  }

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

  const camerasWithPrediction = computed(() => {
    const predictionsMap = new Map<string, PredictionApiItem>()
    for (const item of predictionsRaw.value) {
      const camId = item?.camera?.id
      if (!camId) continue
      predictionsMap.set(camId, item)
    }

    const merged = camerasRaw.value
      .filter((c) => allowedStatus.has(c.status))
      .map((c) => {
        const base = toCamera(c)
        const predItem = predictionsMap.get(c.id)
        const prediction = predItem ? toPrediction(predItem) : undefined
        return {
          ...base,
          prediction,
          predictionStatus: predItem?.status,
          flood_percentage: prediction ? displayFlood(prediction) : base.flood_percentage,
        }
      })

    return merged.sort((a, b) => {
      const aPct = displayFlood(a.prediction)
      const bPct = displayFlood(b.prediction)
      if (aPct !== bPct) return bPct - aPct
      return String(a.name || '').localeCompare(String(b.name || ''))
    })
  })

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
