<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  AQUA_TERRITORY_BBOX,
  AQUA_TERRITORY_BOUNDS,
  AQUA_TERRITORY_CENTER,
  AQUA_TERRITORY_ZOOM,
  isInsideAquaTerritory,
} from '@/utils/aquaTerritory'

interface GeocoderResult {
  center?: [number, number]
}

const props = defineProps<{ latitude: number | null; longitude: number | null }>()
const emit = defineEmits<{
  'update:latitude': [value: number]
  'update:longitude': [value: number]
  selected: [coordinates: { latitude: number; longitude: number }]
}>()
const containerRef = ref<HTMLDivElement | null>(null)
const fallback = ref(false)
let map: mapboxgl.Map | null = null
let marker: mapboxgl.Marker | null = null
let geocoder: MapboxGeocoder | null = null
let lastValidCoordinate = AQUA_TERRITORY_CENTER

function markerElement() {
  const element = document.createElement('div')
  element.setAttribute('aria-label', 'Localização da nova câmera')
  element.style.width = '44px'
  element.style.height = '44px'
  element.style.background = 'url("/icons/camera_icon_normal.svg") center / contain no-repeat'
  element.style.cursor = 'grab'
  return element
}

function setMarker(longitude: number, latitude: number, notify = true) {
  if (!map) return
  if (!isInsideAquaTerritory([longitude, latitude])) return
  if (!marker) {
    marker = new mapboxgl.Marker({ element: markerElement(), draggable: true })
      .setLngLat([longitude, latitude])
      .addTo(map)
    marker.on('dragend', () => {
      const point = marker?.getLngLat()
      if (!point) return
      if (!isInsideAquaTerritory([point.lng, point.lat])) {
        marker?.setLngLat(lastValidCoordinate)
        return
      }
      setMarker(point.lng, point.lat)
    })
  } else {
    marker.setLngLat([longitude, latitude])
  }
  lastValidCoordinate = [longitude, latitude]
  if (notify) {
    emit('update:longitude', longitude)
    emit('update:latitude', latitude)
    emit('selected', { latitude, longitude })
  }
}

onMounted(() => {
  const token = String(import.meta.env.VITE_MAPBOX_API_KEY ?? '')
  if (!containerRef.value || !token) {
    fallback.value = true
    return
  }
  try {
    mapboxgl.accessToken = token
    const hasCoordinates = props.latitude !== null && props.longitude !== null
    const hasValidCoordinates =
      hasCoordinates && isInsideAquaTerritory([props.longitude!, props.latitude!])
    map = new mapboxgl.Map({
      container: containerRef.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: hasValidCoordinates ? [props.longitude!, props.latitude!] : AQUA_TERRITORY_CENTER,
      zoom: hasValidCoordinates ? 16 : AQUA_TERRITORY_ZOOM,
      maxBounds: AQUA_TERRITORY_BOUNDS,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    geocoder = new MapboxGeocoder({
      accessToken: token,
      mapboxgl: mapboxgl as unknown as typeof import('mapbox-gl'),
      marker: false,
      placeholder: 'Buscar endereço da câmera',
      countries: 'br',
      bbox: AQUA_TERRITORY_BBOX,
    })
    map.addControl(geocoder, 'top-left')
    geocoder.on('result', (event: { result: GeocoderResult }) => {
      const center = event.result.center
      if (!center || !isInsideAquaTerritory(center)) return
      setMarker(center[0], center[1])
      map?.flyTo({ center, zoom: 17 })
    })
    map.on('click', (event) => {
      if (isInsideAquaTerritory([event.lngLat.lng, event.lngLat.lat]))
        setMarker(event.lngLat.lng, event.lngLat.lat)
    })
    if (hasValidCoordinates) setMarker(props.longitude!, props.latitude!, false)
  } catch {
    fallback.value = true
  }
})

watch(
  () => [props.longitude, props.latitude] as const,
  ([longitude, latitude]) => {
    if (
      longitude === null ||
      latitude === null ||
      !map ||
      !isInsideAquaTerritory([longitude, latitude])
    )
      return
    setMarker(longitude, latitude, false)
  },
)

onBeforeUnmount(() => {
  marker?.remove()
  marker = null
  if (map && geocoder) map.removeControl(geocoder)
  geocoder = null
  map?.remove()
  map = null
})
</script>

<template>
  <div
    class="relative min-h-[28rem] overflow-hidden rounded-3xl bg-slate-100 shadow-sm dark:bg-[#071F36] lg:min-h-[36rem]"
  >
    <div
      ref="containerRef"
      class="h-[28rem] w-full lg:h-[36rem]"
      :class="{ hidden: fallback }"
    ></div>
    <div v-if="fallback" class="grid h-[28rem] place-items-center px-6 text-center lg:h-[36rem]">
      <div>
        <span class="material-symbols-outlined text-5xl text-slate-400" aria-hidden="true"
          >map</span
        >
        <p class="mt-2 font-semibold">Mapa auxiliar indisponível</p>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Preencha e confirme o endereço e as coordenadas nos campos do formulário.
        </p>
      </div>
    </div>
  </div>
</template>
