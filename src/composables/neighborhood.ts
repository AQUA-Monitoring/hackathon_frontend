import { ref } from 'vue'
import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

interface NeighborhoodFeature {
  type: 'Feature'
  properties: {
    city: string
    neighborhood: string
    zone: string
    name: string
    [key: string]: unknown
  }
  geometry: Polygon | MultiPolygon
}

interface NeighborhoodGeoJSON {
  type: 'FeatureCollection'
  features: NeighborhoodFeature[]
}

export function useNeighborhood() {
  const neighborhoods = ref<NeighborhoodGeoJSON | null>(null)
  const selectedNeighborhood = ref<string | null>(null)
  const selectedCity = ref<string | null>(null)

  async function loadNeighborhoods() {
    try {
      const response = await fetch('/neighborhood.geojson')
      neighborhoods.value = await response.json()
    } catch (error) {
      console.error('Erro ao carregar GeoJSON:', error)
    }
  }

  function getLocalization(
    lng: number,
    lat: number,
  ): { city: string; neighborhood: string } | null {
    if (!neighborhoods.value) return null

    const point = turf.point([lng, lat])

    for (const feature of neighborhoods.value.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        selectedNeighborhood.value = feature.properties.neighborhood
        selectedCity.value = feature.properties.city
        return {
          neighborhood: selectedNeighborhood.value,
          city: selectedCity.value,
        }
      }
    }

    selectedNeighborhood.value = null
    selectedCity.value = null
    return null
  }

  function getIntersectingLocalizations(features: Feature<Polygon | MultiPolygon>[]) {
    if (!neighborhoods.value || !features.length) return []

    const found = new Map<string, { city: string; neighborhood: string }>()

    for (const area of features) {
      for (const neighborhoodFeature of neighborhoods.value.features) {
        try {
          if (!turf.booleanIntersects(area, neighborhoodFeature)) continue
          const localization = {
            city: neighborhoodFeature.properties.city,
            neighborhood: neighborhoodFeature.properties.neighborhood,
          }
          found.set(`${localization.city}:${localization.neighborhood}`, localization)
        } catch {
          // Ignore malformed boundaries and keep checking the remaining neighborhoods.
        }
      }
    }

    return [...found.values()]
  }

  return {
    neighborhoods,
    selectedNeighborhood,
    selectedCity,
    loadNeighborhoods,
    getLocalization,
    getIntersectingLocalizations,
  }
}
