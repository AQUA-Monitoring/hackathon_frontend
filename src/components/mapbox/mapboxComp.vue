<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useGeolocationStore } from '@/stores/geolocation'
import {
  InfoPoints,
  LayersFilters,
  MapboxFilters,
  DataMapboxPopup,
  HeaderMapbox,
} from '@/components'
import { useNeighborhood } from '@/composables/neighborhood'
import { useScreenSize } from '@/composables/screenSize'
import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY

defineProps({
  showItems: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const geolocation = useGeolocationStore()
const { loadNeighborhoods, getLocalization } = useNeighborhood()
const { isMobile } = useScreenSize()
const ctrl = useFloodCameraMonitoringStore()
const neighborhood = ref<string | null>(null)
const city = ref<string | null>(null)
const showPopup = ref<boolean>(false)

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

  function addCustomMarker(lng: number, lat: number, cameraId: string) {
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

  map.on('load', async () => {
    ctrl.camerasRaw.forEach((camera) => {
      if (camera.latitude && camera.longitude) {
        addCustomMarker(camera.longitude, camera.latitude, camera.id)
      } else {
        console.warn('Câmera sem coordenadas:', camera)
      }
    })
  })

  map.on('click', (e) => {
    const { lng, lat } = e.lngLat
    const localization = getLocalization(lng, lat)

    if (!localization) {
      neighborhood.value = null
      city.value = null
      showPopup.value = false
      return
    }

    if (localization.neighborhood === neighborhood.value && showPopup.value) {
      showPopup.value = false
      return
    }

    neighborhood.value = localization.neighborhood
    city.value = localization.city
    showPopup.value = true
  })

  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl,
    marker: true,
    placeholder: 'Buscar local...',
  })

  if (String(route.name) == 'Registrar ponto') {
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

  watch(
    isMobile,
    (mobile) => {
      if (mobile) {
        map.removeControl(geocoder)
      } else {
        map.addControl(geocoder, 'top-left')
      }
    },
    { immediate: true },
  )
})
</script>

<template>
  <div class="relative h-dvh w-full md:h-[42vw] min-h-150 overflow-hidden">
    <div id="map-fixed" class="h-full w-full overflow-hidden md:rounded-2xl"></div>

    <div v-if="showItems">
      <div v-if="!isMobile">
        <InfoPoints />
        <MapboxFilters />
        <LayersFilters />
      </div>

      <div v-else class="absolute inset-0 pointer-events-none">
        <div class="pointer-events-auto">
          <HeaderMapbox />
        </div>
        <div class="pointer-events-auto">
          <DataMapboxPopup v-if="showPopup" :city="city" :neighborhood="neighborhood" />
        </div>
      </div>
    </div>
  </div>
</template>
