import { ref } from 'vue'
import * as turf from '@turf/turf'
import type { Geometry, Feature, Polygon, MultiPolygon } from 'geojson'

interface NeighborhoodFeature {
  type: 'Feature'
  properties: {
    city: string
    neighborhood: string
    zone: string
    name: string
    [key: string]: unknown
  }
  geometry: Geometry
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

  return {
    neighborhoods,
    selectedNeighborhood,
    selectedCity,
    loadNeighborhoods,
    getLocalization,
  }
}
