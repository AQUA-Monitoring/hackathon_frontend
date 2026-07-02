import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import MachineLearningPredictions from '@/services/MachineLearning'
import type { IMachineLearningPrediction } from '@/types/machine_learning'
import type { PredictionApiItem } from '@/types/predictions'
import type { Feature, FeatureCollection, Point } from 'geojson'

export interface MachineLearningMapFeatureProps {
  id: string
  date: string
  probability: number
  flood: number | null
}

export type MachineLearningMapFeature = Feature<Point, MachineLearningMapFeatureProps>
export type MachineLearningFeatureCollection = FeatureCollection<Point, MachineLearningMapFeatureProps>

const parsePredictionItem = (item: any, idx: number): IMachineLearningPrediction => {
  // Adapte aqui conforme payload real da API `/forecast/foresee`
  // Suporte aos campos latitude, longitude, date, probability, flood.
  return {
    latitude: item.latitude ?? item.lat ?? 0,
    longitude: item.longitude ?? item.lon ?? 0,
    date: item.date ?? item.timestamp ?? '',
    probability: item.probability ?? item.confidence ?? (item.probabilities?.flooded ?? 0),
    flood: typeof item.flood === 'number' ? item.flood : (item.is_flooded ? 1 : 0)
  }
}

export const useMachineLearningStore = defineStore('machine_learning', () => {
  const predictionsRaw = ref<IMachineLearningPrediction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<string | null>(null)
  let inFlight: Promise<void> | null = null

  // -- Normalização: transforma probabilidade entre 0-1 em percentual --
  const normalizeProbability = (value: number) => {
    if (!Number.isFinite(value)) return 0
    const percent = value <= 1 ? value * 100 : value
    return Math.round(Math.min(100, Math.max(0, percent)))
  }

  // -- GeoJSON sempre atualizado --
  const geoJson = computed<MachineLearningFeatureCollection>(() => {
    const features: MachineLearningMapFeature[] = (predictionsRaw.value ?? []).map((item, idx) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude, item.latitude],
      },
      properties: {
        id: `${item.flood ?? 'pred'}-${idx}`,
        date: item.date,
        probability: normalizeProbability(item.probability),
        flood: item.flood ?? null,
      },
    }))
    return {
      type: 'FeatureCollection',
      features,
    }
  })

  const load = async () => {
    if (inFlight) return inFlight
    inFlight = (async () => {
      loading.value = true
      error.value = null
      try {
        const service = new MachineLearningPredictions()
        const data = await service.getMachineLearningPredictions()
        // Mapeia cada item para IMachineLearningPrediction
        const mapped = Array.isArray(data?.results) ? data.results.map(parsePredictionItem) : []
        predictionsRaw.value = mapped
        lastFetchedAt.value = new Date().toISOString()
      } catch (err: any) {
        error.value = err?.message || 'Não foi possível carregar as previsões de ML.'
      } finally {
        loading.value = false
        inFlight = null
      }
    })()
    return inFlight
  }

  const refresh = async () => {
    await load()
  }

  return {
    predictionsRaw,
    geoJson,
    loading,
    error,
    lastFetchedAt,
    load,
    refresh,
  }
})
