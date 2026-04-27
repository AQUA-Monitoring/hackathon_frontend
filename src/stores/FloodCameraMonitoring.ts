import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import FloodCameraMonitoringApi from '@/services/FloodCameraMonitoring'
import FloodPredictionsApi from '@/services/FloodPredictions'
import FloodDemoApi from '@/services/FloodDemo'
import type { ICamera } from '../types/camera'
import type { PredictionData } from '../types/predictions'

export const useFloodCameraMonitoringStore = defineStore('flood_monitoring', () => {
  const cameras = ref<ICamera[]>([])
  const predictionsById = ref<Record<string, PredictionData>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const predictionsError = ref<string | null>(null)

  const camerasApi = new FloodCameraMonitoringApi()
  const predsApi = new FloodPredictionsApi()
  const demoApi = new FloodDemoApi()

  let inFlight: Promise<void> | null = null

  const load = async (): Promise<void> => {
    if (inFlight) return inFlight

    inFlight = (async () => {
      loading.value = true
      error.value = null
      predictionsError.value = null

      const [camsRes, predsRes, demoRes] = await Promise.allSettled([
        camerasApi.getAllCameras(),
        predsApi.getAllFloodPredictions(),
        Promise.all([demoApi.get(), demoApi.predictDemo()]),
      ])

      // ✅ CAMERAS
      if (camsRes.status === 'fulfilled') {
        cameras.value = camsRes.value ?? []
      } else {
        error.value = camsRes.reason?.message ?? 'Erro ao carregar câmeras'
        loading.value = false
        return
      }

      // ✅ DEMO
      if (demoRes.status === 'fulfilled') {
        const [demoHlsUrl, demoPred] = demoRes.value

        if (demoHlsUrl) {
          const demoCamera: ICamera = {
            id: 'demo',
            name: 'Câmera Demo',
            hls_url: demoHlsUrl,
            embed_url: undefined,
            status: 'Online',
            flood_percentage: 0,
            link: '',
            latitude: 0,
            longitude: 0,
          }

          cameras.value.push(demoCamera)

          if (demoPred) {
            predictionsById.value['demo'] = {
              is_flooded: demoPred.is_flooded ?? false,
              confidence: demoPred.confidence ?? 0,
              probabilities: {
                normal: demoPred.probabilities?.normal ?? 1 - (demoPred.confidence ?? 0) / 100,
                flooded: demoPred.probabilities?.flooded ?? (demoPred.confidence ?? 0) / 100,
              },
            }
          }
        }
      }

      // ✅ PREDICTIONS
      if (predsRes.status === 'fulfilled') {
        const map: Record<string, PredictionData> = { ...predictionsById.value }

        for (const item of predsRes.value ?? []) {
          const camId = item?.camera?.id
          if (!camId) continue

          const pred = (item as any).prediction ?? {
            is_flooded: item.is_flooded ?? false,
            confidence: item.confidence ?? 0,
            probabilities: item.probabilities ?? { normal: 0, flooded: 0 },
          }

          map[camId] = pred
        }

        predictionsById.value = map
      } else {
        predictionsError.value = predsRes.reason?.message ?? 'Predições indisponíveis'
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
    cameras.value.map((c) => {
      const prediction = predictionsById.value[c.id]

      return {
        ...c,
        prediction,
        flood_percentage:
          c.id === 'demo' && prediction
            ? Number(Math.min(100, Math.max(0, prediction.probabilities.flooded)).toFixed(2))
            : c.flood_percentage,
      }
    }),
  )

  return {
    cameras,
    predictionsById,
    loading,
    error,
    camerasWithPrediction,
    predictionsError,
    load,
  }
})
