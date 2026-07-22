import { ref, type Ref } from 'vue'
import type mapboxgl from 'mapbox-gl'
import type { FloodPointUiItem } from '@/modules/flood-points'
import { FLOOD_FILL_LAYER_ID, ML_LAYER_ID } from './useMapSourcesLayers'

type Localization = { neighborhood: string; city: string }

const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : null
const number = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const useMapPopup = (options: {
  getLocalization: (lng: number, lat: number) => Localization | null | undefined
  selectFlood: (id: string) => void
  clearSelectedFlood: () => void
  selectedFlood: Ref<FloodPointUiItem | null>
}) => {
  const neighborhood = ref<string | null>(null)
  const city = ref<string | null>(null)
  const probability = ref<number | null>(null)
  const showPopup = ref(false)

  const handleClick = (map: mapboxgl.Map, event: mapboxgl.MapMouseEvent) => {
    const flood = map.getLayer(FLOOD_FILL_LAYER_ID)
      ? map.queryRenderedFeatures(event.point, { layers: [FLOOD_FILL_LAYER_ID] })[0]
      : undefined
    if (flood) {
      const floodId = text(flood.properties?.floodId)
      if (floodId) options.selectFlood(floodId)
      neighborhood.value = text(flood.properties?.neighborhood)
      city.value = text(flood.properties?.city)
      probability.value = number(flood.properties?.probability)
      showPopup.value = true
      return
    }
    const ml = map.getLayer(ML_LAYER_ID)
      ? map.queryRenderedFeatures(event.point, { layers: [ML_LAYER_ID] })[0]
      : undefined
    if (ml) {
      options.clearSelectedFlood()
      neighborhood.value = null
      city.value = null
      probability.value = number(ml.properties?.probability)
      showPopup.value = true
      return
    }
    options.clearSelectedFlood()
    const localization = options.getLocalization(event.lngLat.lng, event.lngLat.lat)
    if (!localization) {
      neighborhood.value = city.value = probability.value = null
      showPopup.value = false
    } else if (localization.neighborhood === neighborhood.value && showPopup.value) {
      showPopup.value = false
    } else {
      neighborhood.value = localization.neighborhood
      city.value = localization.city
      probability.value = null
      showPopup.value = true
    }
  }

  const syncSelected = () => {
    const flood = options.selectedFlood.value
    if (!flood) return
    neighborhood.value = flood.neighborhoodSummary
    city.value = flood.city
    probability.value = flood.probability
  }

  return { neighborhood, city, probability, showPopup, handleClick, syncSelected }
}
