import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import FloodPointsApi from '../services/FloodPoints'
import type {
  FloodPointApiItem,
  FloodPointFeatureCollection,
  FloodPointMapFeature,
  FloodPointUiItem,
} from '../types/floodPoints'
import type { IFloodListItem } from '../types/flood'
import { adaptFloodPoint } from '../floodPointAdapter'
import { parseApiError } from '@/shared'

const floodPointsApi = new FloodPointsApi()

const toDateMs = (iso: string): number | null => {
  const ms = new Date(iso).getTime()
  return Number.isFinite(ms) ? ms : null
}

const normalizeProbability = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  const percent = value <= 1 ? value * 100 : value
  return Math.round(Math.min(100, Math.max(0, percent)))
}

const durationMinutes = (createdAt: string, finishedAt: string): number => {
  const start = toDateMs(createdAt)
  const end = toDateMs(finishedAt)
  if (start === null || end === null || end < start) return 0
  return Math.round((end - start) / 60000)
}

const isActiveNow = (item: FloodPointApiItem, now = Date.now()): boolean => {
  const start = toDateMs(item.created_at)
  const end = toDateMs(item.finished_at)
  if (start === null || end === null) return false
  return start <= now && now <= end
}

export const useFloodPointsStore = defineStore('flood_points', () => {
  const itemsRaw = ref<FloodPointApiItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<string | null>(null)
  const selectedFloodId = ref<string | null>(null)
  let inFlight: Promise<void> | null = null

  const activeItems = computed(() => {
    const now = Date.now()
    return itemsRaw.value.filter((item) => isActiveNow(item, now))
  })

  const activeItemsUi = computed<FloodPointUiItem[]>(() => {
    return activeItems.value
      .map((item) =>
        adaptFloodPoint(
          item,
          normalizeProbability(item.possibility),
          durationMinutes(item.created_at, item.finished_at),
        ),
      )
      .sort((a, b) => b.probability - a.probability)
  })

  const tablePoints = computed<IFloodListItem[]>(() => {
    return activeItemsUi.value.map((item) => ({
      id: item.id,
      neighborhood: item.neighborhoodSummary,
      neighborhoods: item.neighborhoods,
      referenceBaseRevision: item.referenceBaseRevision,
      duration: item.duration,
      createdAt: item.createdAt,
      probability: item.probability,
    }))
  })

  const activeGeoJson = computed<FloodPointFeatureCollection>(() => {
    const features: FloodPointMapFeature[] = []
    const uiItemsById = new Map(activeItemsUi.value.map((item) => [item.id, item]))

    for (const item of activeItems.value) {
      const props = Array.isArray(item.props) ? item.props : []

      for (const [index, feature] of props.entries()) {
        if (!feature?.geometry) continue
        if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') continue

        features.push({
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            floodId: String(item.id),
            featureId: String(feature.id ?? `${item.id}-${index}`),
            city: item.city_name,
            neighborhood: uiItemsById.get(String(item.id))?.neighborhoodSummary ?? item.neighborhood_name,
            probability: normalizeProbability(item.possibility),
            createdAt: item.created_at,
            finishedAt: item.finished_at,
          },
        })
      }
    }

    return {
      type: 'FeatureCollection',
      features,
    }
  })

  const selectedFlood = computed<FloodPointUiItem | null>(() => {
    if (!selectedFloodId.value) return null
    return activeItemsUi.value.find((item) => item.id === selectedFloodId.value) ?? null
  })

  const hasActiveFloods = computed(() => activeItems.value.length > 0)

  const load = async () => {
    if (inFlight) return inFlight

    inFlight = (async () => {
    loading.value = true
    error.value = null

    try {
      const data = await floodPointsApi.getFloodPoints()
      itemsRaw.value = data.results ?? []
      lastFetchedAt.value = new Date().toISOString()

      if (selectedFloodId.value) {
        const exists = activeItemsUi.value.some((item) => item.id === selectedFloodId.value)
        if (!exists) {
          selectedFloodId.value = null
        }
      }
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Nao foi possivel carregar os pontos de alagamento.')
      error.value = parsed.message
      throw parsed
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

  const selectFlood = (floodId: string) => {
    selectedFloodId.value = floodId
  }

  const clearSelectedFlood = () => {
    selectedFloodId.value = null
  }

  return {
    itemsRaw,
    loading,
    error,
    lastFetchedAt,
    selectedFloodId,
    activeItems,
    activeItemsUi,
    tablePoints,
    activeGeoJson,
    selectedFlood,
    hasActiveFloods,
    load,
    refresh,
    selectFlood,
    clearSelectedFlood,
  }
})
