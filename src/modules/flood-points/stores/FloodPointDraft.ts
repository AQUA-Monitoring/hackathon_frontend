import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import * as turf from '@turf/turf'

import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { FloodPointApiFeature } from '../types/floodPoints'

interface FloodLocalization {
  city: string
  cityId: string | null
  neighborhood: string
  neighborhoodId: string | null
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

const DRAFT_STORAGE_KEY = 'aqua:flood-point-geometry-draft'

const extractRepresentativePoint = (features: FloodPointApiFeature[]): FloodCentroid | null => {
  if (!features.length) return null

  try {
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    }
    // pointOnFeature always returns a point inside/on the marked area. A geometric
    // centroid can fall outside concave polygons and identify the wrong neighborhood.
    const representativePoint = turf.pointOnFeature(collection)
    const [lng, lat] = representativePoint.geometry.coordinates

    if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return null

    return { lng, lat }
  } catch {
    return null
  }
}

export const useFloodPointDraftStore = defineStore('flood_point_draft', () => {
  const storedFeatures = (() => {
    if (typeof window === 'undefined') return []

    try {
      const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY)
      const parsed: unknown = stored ? JSON.parse(stored) : []
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((feature) => sanitizeFeature(feature))
        .filter((feature): feature is FloodPointApiFeature => feature !== null)
    } catch {
      return []
    }
  })()

  const drawnFeatures = ref<FloodPointApiFeature[]>(storedFeatures)
  const centroid = ref<FloodCentroid | null>(extractRepresentativePoint(storedFeatures))
  const localization = ref<FloodLocalization | null>(null)

  const hasGeometry = computed(() => drawnFeatures.value.length > 0)
  const footprint = computed<MultiPolygon | null>(() => {
    const coordinates: MultiPolygon['coordinates'] = []
    for (const feature of drawnFeatures.value) {
      if (feature.geometry.type === 'Polygon') coordinates.push(feature.geometry.coordinates)
      else coordinates.push(...feature.geometry.coordinates)
    }
    return coordinates.length ? { type: 'MultiPolygon', coordinates } : null
  })

  const setDrawFeatures = (rawFeatures: unknown[]) => {
    const sanitized = rawFeatures
      .map((feature) => sanitizeFeature(feature))
      .filter((feature): feature is FloodPointApiFeature => feature !== null)

    drawnFeatures.value = sanitized
    centroid.value = extractRepresentativePoint(sanitized)
  }

  const setLocalization = (next: FloodLocalization | null) => {
    localization.value = next
  }

  const clearDraft = () => {
    drawnFeatures.value = []
    centroid.value = null
    localization.value = null
  }

  watch(
    drawnFeatures,
    (features) => {
      if (typeof window === 'undefined') return

      if (features.length) {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(features))
      } else {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      }
    },
    { deep: true },
  )

  return {
    drawnFeatures,
    centroid,
    localization,
    hasGeometry,
    footprint,
    setDrawFeatures,
    setLocalization,
    clearDraft,
  }
})
