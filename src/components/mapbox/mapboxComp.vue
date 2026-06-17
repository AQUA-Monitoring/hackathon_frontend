<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useGeolocationStore } from '@/stores/geolocation'
import { useFloodPointsMap } from '@/composables/useFloodPointsMap'
import {
  InfoPoints,
  LayersFilters,
  MapboxFilters,
  DataMapboxPopup,
  HeaderMapbox,
} from '@/components'
import { useNeighborhood } from '@/composables/neighborhood'
import { useScreenSize } from '@/composables/screenSize'
import type { FloodPointFeatureCollection } from '@/types/floodPoints'
import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'

const FLOOD_SOURCE_ID = 'flood-points-source'
const FLOOD_FILL_LAYER_ID = 'flood-points-fill'
const FLOOD_OUTLINE_LAYER_ID = 'flood-points-outline'

mapboxgl.accessToken = String(import.meta.env.VITE_MAPBOX_API_KEY)

defineProps({
  showItems: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const geolocation = useGeolocationStore()
const { loadNeighborhoods, getLocalization } = useNeighborhood()
const { activeGeoJson, selectFlood, clearSelectedFlood, selectedFlood } = useFloodPointsMap()
const { isMobile } = useScreenSize()
const ctrl = useFloodCameraMonitoringStore()
const neighborhood = ref<string | null>(null)
const city = ref<string | null>(null)
const probability = ref<number | null>(null)
const showPopup = ref<boolean>(false)
const mapRef = ref<mapboxgl.Map | null>(null)
const geocoderRef = ref<MapboxGeocoder | null>(null)
const isGeocoderAdded = ref(false)

const addFloodLayers = (map: mapboxgl.Map, data: FloodPointFeatureCollection) => {
  if (!map.getSource(FLOOD_SOURCE_ID)) {
    map.addSource(FLOOD_SOURCE_ID, {
      type: 'geojson',
      data,
    })
  }

  if (!map.getLayer(FLOOD_FILL_LAYER_ID)) {
    map.addLayer({
      id: FLOOD_FILL_LAYER_ID,
      type: 'fill',
      source: FLOOD_SOURCE_ID,
      paint: {
        'fill-color': ['step', ['get', 'probability'], '#87FD8B', 41, '#FFE101', 71, '#FF4D4D'],
        'fill-opacity': 0.4,
      },
    })
  }

  if (!map.getLayer(FLOOD_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: FLOOD_OUTLINE_LAYER_ID,
      type: 'line',
      source: FLOOD_SOURCE_ID,
      paint: {
        'line-color': ['step', ['get', 'probability'], '#0F9900', 41, '#CCAA00', 71, '#C92A2A'],
        'line-width': 2,
      },
    })
  }
}

const updateFloodSource = (map: mapboxgl.Map, data: FloodPointFeatureCollection) => {
  const source = map.getSource(FLOOD_SOURCE_ID)
  if (!source) return
  ;(source as mapboxgl.GeoJSONSource).setData(data)
}

const extractString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) return value
  return null
}

const extractProbability = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const addCustomMarker = (map: mapboxgl.Map, lng: number, lat: number, cameraId: string) => {
  const el = document.createElement('div')

  el.className = 'custom-marker'
  el.style.backgroundImage = 'url("/icons/camera.svg")'
  el.style.width = '80px'
  el.style.height = '80px'
  el.style.backgroundSize = 'contain'
  el.style.backgroundRepeat = 'no-repeat'
  el.style.cursor = 'pointer'

  el.addEventListener('click', () => {
    router.push(`/cameras/${cameraId}`)
  })

  new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map)
}

onMounted(async () => {
  await loadNeighborhoods()

  const map = new mapboxgl.Map({
    container: 'map-fixed',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [geolocation.longitude ?? -48.8464, geolocation.latitude ?? -26.3044],
    zoom: 13,
    pitch: 60,
    bearing: -30,
    antialias: true,
    maxBounds: [
      [-49.0, -26.6],
      [-48.4, -25.9],
    ],
  })

  mapRef.value = map

  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken!,
    mapboxgl: mapboxgl as unknown as typeof import('mapbox-gl'),
    marker: true,
    placeholder: 'Buscar local...',
  })

  geocoderRef.value = geocoder

  map.on('load', () => {
    addFloodLayers(map, activeGeoJson.value)

    ctrl.camerasRaw.forEach((camera) => {
      if (camera.latitude && camera.longitude) {
        addCustomMarker(map, camera.longitude, camera.latitude, camera.id)
      } else {
        console.warn('Câmera sem coordenadas:', camera)
      }
    })

    map.on('click', (e) => {
      const hasFloodLayer = Boolean(map.getLayer(FLOOD_FILL_LAYER_ID))

      const rendered = hasFloodLayer
        ? map.queryRenderedFeatures(e.point, {
            layers: [FLOOD_FILL_LAYER_ID],
          })
        : []

      if (rendered.length > 0) {
        const first = rendered[0]

        if (!first) return

        const floodId = extractString(first.properties?.floodId)
        const featureCity = extractString(first.properties?.city)
        const featureNeighborhood = extractString(first.properties?.neighborhood)
        const featureProbability = extractProbability(first.properties?.probability)

        if (floodId) {
          selectFlood(floodId)
        }

        neighborhood.value = featureNeighborhood
        city.value = featureCity
        probability.value = featureProbability
        showPopup.value = true

        return
      }

      clearSelectedFlood()

      const { lng, lat } = e.lngLat
      const localization = getLocalization(lng, lat)

      if (!localization) {
        neighborhood.value = null
        city.value = null
        probability.value = null
        showPopup.value = false
        return
      }

      if (localization.neighborhood === neighborhood.value && showPopup.value) {
        showPopup.value = false
        return
      }

      neighborhood.value = localization.neighborhood
      city.value = localization.city
      probability.value = null
      showPopup.value = true
    })

    if (String(route.name) === 'Registrar ponto') {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'draw_polygon',
      })

      map.addControl(draw, 'top-right')
    }
  })

  watch(
    isMobile,
    (mobile) => {
      if (mobile) {
        if (isGeocoderAdded.value) {
          map.removeControl(geocoder)
          isGeocoderAdded.value = false
        }
      } else {
        if (!isGeocoderAdded.value) {
          map.addControl(geocoder, 'top-left')
          isGeocoderAdded.value = true
        }
      }
    },
    { immediate: true },
  )

  watch(
    activeGeoJson,
    (nextGeoJson) => {
      if (!map.loaded()) return

      if (!map.getSource(FLOOD_SOURCE_ID)) {
        addFloodLayers(map, nextGeoJson)
        return
      }

      updateFloodSource(map, nextGeoJson)
    },
    { deep: true },
  )

  watch(selectedFlood, (flood) => {
    if (!flood) return

    neighborhood.value = flood.neighborhood
    city.value = flood.city
    probability.value = flood.probability
  })
})

onBeforeUnmount(() => {
  const map = mapRef.value
  const geocoder = geocoderRef.value

  if (!map) return

  if (geocoder) {
    if (isGeocoderAdded.value) {
      map.removeControl(geocoder)
      isGeocoderAdded.value = false
    }
  }

  map.remove()
  mapRef.value = null
  geocoderRef.value = null
})
</script>

<template>
  <div class="relative h-dvh w-full md:h-[42vw] min-h-150 overflow-hidden">
    <div id="map-fixed" class="h-full w-full overflow-hidden md:rounded-2xl"></div>

    <div v-if="showItems">
      <div v-if="!isMobile">
        <InfoPoints />
        <!-- <MapboxFilters /> -->
        <!-- <LayersFilters /> -->
      </div>

      <div v-else class="absolute inset-0 pointer-events-none">
        <div class="pointer-events-auto">
          <HeaderMapbox />
        </div>
        <div class="pointer-events-auto">
          <DataMapboxPopup
            v-if="showPopup"
            :city="city"
            :neighborhood="neighborhood"
            :probability="probability"
          />
        </div>
      </div>
    </div>
  </div>
</template>
