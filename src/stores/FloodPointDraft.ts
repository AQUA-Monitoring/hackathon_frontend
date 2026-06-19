import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as turf from '@turf/turf'

import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { FloodPointApiFeature } from '@/types/floodPoints'

interface FloodLocalization {
  city: string
  neighborhood: string
}

interface FloodCentroid {
  lng: number
  lat: number
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const hasValidCoordinates = (value: unknown): boolean => {
  if (!Array.isArray(value) || value.length === 0) return false

  const first = value[0]
  if (typeof first === 'number') {
    const lng = value[0]
    const lat = value[1]

    if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return false

    return (
      value.length >= 2 &&
      value.every((coord) => isFiniteNumber(coord)) &&
      Math.abs(lng) <= 180 &&
      Math.abs(lat) <= 90
    )
  }

  return value.every((nested) => hasValidCoordinates(nested))
}

const sanitizeFeature = (feature: unknown): FloodPointApiFeature | null => {
  if (!feature || typeof feature !== 'object') return null

  const candidate = feature as {
    id?: unknown
    type?: unknown
    geometry?: { type?: unknown; coordinates?: unknown }
    properties?: unknown
  }

  if (candidate.type !== 'Feature') return null

  const geometry = candidate.geometry
  if (!geometry) return null

  const geometryType = geometry.type
  if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') return null

  if (!hasValidCoordinates(geometry.coordinates)) return null

  const properties =
    candidate.properties && typeof candidate.properties === 'object'
      ? (candidate.properties as Record<string, unknown>)
      : {}

  if (geometryType === 'Polygon') {
    return {
      id: typeof candidate.id === 'string' ? candidate.id : undefined,
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: geometry.coordinates as Polygon['coordinates'],
      },
      properties,
    }
  }

  return {
    id: typeof candidate.id === 'string' ? candidate.id : undefined,
    type: 'Feature',
    geometry: {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates as MultiPolygon['coordinates'],
    },
    properties,
  }
}

const extractCentroid = (features: FloodPointApiFeature[]): FloodCentroid | null => {
  if (!features.length) return null

  try {
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    }
    const centroid = turf.centroid(collection)
    const [lng, lat] = centroid.geometry.coordinates

    if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return null

    return { lng, lat }
  } catch {
    return null
  }
}

export const useFloodPointDraftStore = defineStore('flood_point_draft', () => {
  const drawnFeatures = ref<FloodPointApiFeature[]>([])
  const centroid = ref<FloodCentroid | null>(null)
  const localization = ref<FloodLocalization | null>(null)

  const hasGeometry = computed(() => drawnFeatures.value.length > 0)

  const setDrawFeatures = (rawFeatures: unknown[]) => {
    const sanitized = rawFeatures
      .map((feature) => sanitizeFeature(feature))
      .filter((feature): feature is FloodPointApiFeature => feature !== null)

    drawnFeatures.value = sanitized
    centroid.value = extractCentroid(sanitized)
  }

  const setLocalization = (next: FloodLocalization | null) => {
    localization.value = next
  }

  const clearDraft = () => {
    drawnFeatures.value = []
    centroid.value = null
    localization.value = null
  }

  return {
    drawnFeatures,
    centroid,
    localization,
    hasGeometry,
    setDrawFeatures,
    setLocalization,
    clearDraft,
  }
})
