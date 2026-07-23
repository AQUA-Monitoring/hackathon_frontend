import { computed, readonly, ref } from 'vue'
import AddressingApi from '../services/Addressing'
import type { TerritoryCatalogOption } from '../types/addressing'

export function useTerritoryCatalog() {
  const api = new AddressingApi()
  const regions = ref<TerritoryCatalogOption[]>([])
  const neighborhoods = ref<TerritoryCatalogOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let loaded = false
  let loadPromise: Promise<void> | null = null

  function load() {
    if (loaded) return Promise.resolve()
    if (loadPromise) return loadPromise
    loadPromise = (async () => {
      loading.value = true
      error.value = null
      try {
        const catalog = await api.getTerritoryCatalog()
        regions.value = catalog.regions
        neighborhoods.value = catalog.neighborhoods
        loaded = true
      } catch {
        error.value = 'Não foi possível carregar regiões e bairros.'
      } finally {
        loading.value = false
        loadPromise = null
      }
    })()
    return loadPromise
  }

  function neighborhoodsFor(regionId: string) {
    return regionId
      ? neighborhoods.value.filter((item) => item.regionId === regionId)
      : neighborhoods.value
  }

  function isValidPair(regionId: string, neighborhoodId: string) {
    if (regionId && !regions.value.some((item) => item.id === regionId)) return false
    if (!neighborhoodId) return true
    const neighborhood = neighborhoods.value.find((item) => item.id === neighborhoodId)
    return Boolean(neighborhood && (!regionId || neighborhood.regionId === regionId))
  }

  function normalizePair(regionId: string, neighborhoodId: string) {
    const normalizedRegionId = regions.value.some((item) => item.id === regionId) ? regionId : ''
    return {
      regionId: normalizedRegionId,
      neighborhoodId: isValidPair(normalizedRegionId, neighborhoodId) ? neighborhoodId : '',
    }
  }

  return {
    regions: readonly(regions),
    neighborhoods: readonly(neighborhoods),
    loading: readonly(loading),
    error: readonly(error),
    available: computed(() => loaded && !error.value),
    load,
    neighborhoodsFor,
    isValidPair,
    normalizePair,
  }
}
