import { ref } from 'vue'
import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import AddressingApi from '../services/Addressing'
import { REFERENCE_BASE_LABEL, REFERENCE_BASE_TEXT } from '../referenceBase'
import { formatTerritoryLabel } from '@/shared'
import type {
  ReferenceTerritoryCollection,
  TerritoryCatalogSource,
  TerritoryFeature,
  TerritoryFeatureCollection,
} from '../types/addressing'

interface LegacyNeighborhoodFeature {
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
  features: LegacyNeighborhoodFeature[]
}

export interface ResolvedLocalization {
  city: string
  cityId: string | null
  neighborhood: string
  neighborhoodId: string | null
  regionId: string | null
}

const addressingApi = new AddressingApi()

function normalizeCanonicalFeature(feature: TerritoryFeature): ResolvedLocalization | null {
  const properties = feature.properties
  if (properties.type !== 'neighborhood' || !properties.name || !properties.city) return null
  return {
    city: properties.city,
    cityId: properties.city_id,
    neighborhood: formatTerritoryLabel(properties.name),
    neighborhoodId: properties.id,
    regionId: properties.region_id,
  }
}

function normalizeLegacyFeature(feature: LegacyNeighborhoodFeature): ResolvedLocalization {
  return {
    city: feature.properties.city,
    cityId: null,
    neighborhood: formatTerritoryLabel(feature.properties.neighborhood),
    neighborhoodId: null,
    regionId: null,
  }
}

function toInternalTerritories(
  collection: ReferenceTerritoryCollection,
): TerritoryFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.map((feature) => ({
      type: 'Feature',
      id: feature.id,
      bbox: feature.bbox,
      geometry: feature.geometry,
      properties: {
        id:
          feature.properties.referenceNeighborhoodId ??
          feature.properties.referenceTerritoryId,
        name: feature.properties.name,
        type: feature.properties.type,
        city: feature.properties.city,
        city_id: feature.properties.referenceCityId,
        region_id: feature.properties.referenceRegionId,
        source_record_id: feature.properties.sourceRecordId ?? undefined,
      },
    })),
  }
}

export function useNeighborhood() {
  const canonicalTerritories = ref<TerritoryFeatureCollection | null>(null)
  const fallbackNeighborhoods = ref<NeighborhoodGeoJSON | null>(null)
  const selectedNeighborhood = ref<string | null>(null)
  const selectedCity = ref<string | null>(null)
  const catalogSource = ref<TerritoryCatalogSource>('unavailable')
  const loadingTerritories = ref(false)
  const catalogError = ref<string | null>(null)
  const referenceBaseRevision = ref<string | null>(null)

  async function loadNeighborhoods() {
    loadingTerritories.value = true
    catalogError.value = null
    referenceBaseRevision.value = null
    try {
      const referenceCollection = await addressingApi.getReferenceTerritories({
        type: 'neighborhood',
      })
      const collection = toInternalTerritories(referenceCollection)
      if (!Array.isArray(collection.features) || collection.features.length === 0) {
        throw new Error(`${REFERENCE_BASE_LABEL} sem bairros ativos.`)
      }
      canonicalTerritories.value = collection
      fallbackNeighborhoods.value = null
      catalogSource.value = 'canonical'
      referenceBaseRevision.value = referenceCollection.referenceBaseRevision
    } catch {
      try {
        const collection = await addressingApi.getNeighborhoodTerritories()
        if (!Array.isArray(collection.features) || collection.features.length === 0) {
          throw new Error(`${REFERENCE_BASE_LABEL} sem bairros ativos.`)
        }
        canonicalTerritories.value = collection
        fallbackNeighborhoods.value = null
        catalogSource.value = 'canonical'
      } catch {
        canonicalTerritories.value = null
        try {
          const response = await fetch('/neighborhood.geojson')
          if (!response.ok) throw new Error('Fallback territorial indisponível.')
          const collection = (await response.json()) as NeighborhoodGeoJSON
          if (!Array.isArray(collection.features) || collection.features.length === 0) {
            throw new Error('Fallback territorial vazio.')
          }
          fallbackNeighborhoods.value = collection
          catalogSource.value = 'local-fallback'
          catalogError.value = REFERENCE_BASE_TEXT.unavailableDescription
        } catch {
          fallbackNeighborhoods.value = null
          catalogSource.value = 'unavailable'
          catalogError.value = REFERENCE_BASE_TEXT.unresolvedDescription
        }
      }
    } finally {
      loadingTerritories.value = false
    }
  }

  function getLocalization(
    lng: number,
    lat: number,
  ): ResolvedLocalization | null {
    const point = turf.point([lng, lat])

    for (const feature of canonicalTerritories.value?.features ?? []) {
      if (turf.booleanPointInPolygon(point, feature)) {
        const localization = normalizeCanonicalFeature(feature)
        if (!localization) continue
        selectedNeighborhood.value = localization.neighborhood
        selectedCity.value = localization.city
        return localization
      }
    }

    for (const feature of fallbackNeighborhoods.value?.features ?? []) {
      if (turf.booleanPointInPolygon(point, feature)) {
        const localization = normalizeLegacyFeature(feature)
        selectedNeighborhood.value = localization.neighborhood
        selectedCity.value = localization.city
        return localization
      }
    }

    selectedNeighborhood.value = null
    selectedCity.value = null
    return null
  }

  function getIntersectingLocalizations(features: Feature<Polygon | MultiPolygon>[]) {
    if (!features.length) return []

    const found = new Map<string, ResolvedLocalization>()

    for (const area of features) {
      for (const neighborhoodFeature of canonicalTerritories.value?.features ?? []) {
        try {
          if (!turf.booleanIntersects(area, neighborhoodFeature)) continue
          const localization = normalizeCanonicalFeature(neighborhoodFeature)
          if (localization) {
            found.set(localization.neighborhoodId ?? localization.neighborhood, localization)
          }
        } catch {
          // Ignore malformed boundaries and keep checking the remaining neighborhoods.
        }
      }
      for (const neighborhoodFeature of fallbackNeighborhoods.value?.features ?? []) {
        try {
          if (!turf.booleanIntersects(area, neighborhoodFeature)) continue
          const localization = normalizeLegacyFeature(neighborhoodFeature)
          found.set(`${localization.city}:${localization.neighborhood}`, localization)
        } catch {
          // Ignore malformed fallback boundaries and keep checking.
        }
      }
    }

    return [...found.values()]
  }

  return {
    neighborhoods: canonicalTerritories,
    selectedNeighborhood,
    selectedCity,
    catalogSource,
    loadingTerritories,
    catalogError,
    referenceBaseRevision,
    loadNeighborhoods,
    getLocalization,
    getIntersectingLocalizations,
  }
}
