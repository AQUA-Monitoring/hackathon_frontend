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
} from '@/shared'
import FloodCameraMonitoringApi from '../FloodCameraMonitoringApi'
import type { AddressAutocompleteSuggestion } from '../types/camera'

interface GeocoderResult {
  center?: [number, number]
}

const props = defineProps<{
  latitude: number | null
  longitude: number | null
  cityId?: string
  neighborhoodId?: string
}>()
const emit = defineEmits<{
  'update:latitude': [value: number]
  'update:longitude': [value: number]
  selected: [coordinates: { latitude: number; longitude: number }]
  'suggestion-selected': [suggestion: AddressAutocompleteSuggestion]
}>()
const api = new FloodCameraMonitoringApi()
const containerRef = ref<HTMLDivElement | null>(null)
const fallback = ref(false)
const catalogQuery = ref('')
const catalogSuggestions = ref<AddressAutocompleteSuggestion[]>([])
const catalogLoading = ref(false)
const catalogUnavailable = ref(false)
let map: mapboxgl.Map | null = null
let marker: mapboxgl.Marker | null = null
let geocoder: MapboxGeocoder | null = null
let lastValidCoordinate = AQUA_TERRITORY_CENTER
let catalogTimer: ReturnType<typeof setTimeout> | null = null
let catalogController: AbortController | null = null

function closeCatalogSuggestions() {
  catalogSuggestions.value = []
}

async function searchCatalog(query: string) {
  catalogController?.abort()
  const normalized = query.trim()
  if (normalized.length < 3 || !props.cityId) {
    closeCatalogSuggestions()
    catalogLoading.value = false
    return
  }
  const controller = new AbortController()
  catalogController = controller
  catalogLoading.value = true
  catalogUnavailable.value = false
  try {
    catalogSuggestions.value = await api.autocompleteAddress(
      {
        kind: 'address',
        q: normalized,
        city_id: props.cityId || undefined,
        neighborhood_id: props.neighborhoodId || undefined,
      },
      controller.signal,
    )
  } catch {
    if (!controller.signal.aborted) {
      catalogSuggestions.value = []
      catalogUnavailable.value = true
    }
  } finally {
    if (catalogController === controller) {
      catalogController = null
      catalogLoading.value = false
    }
  }
}

function chooseCatalogSuggestion(suggestion: AddressAutocompleteSuggestion) {
  catalogQuery.value = suggestion.label
  closeCatalogSuggestions()
  emit('suggestion-selected', suggestion)
  if (
    suggestion.longitude !== null &&
    suggestion.latitude !== null &&
    isInsideAquaTerritory([suggestion.longitude, suggestion.latitude])
  ) {
    setMarker(suggestion.longitude, suggestion.latitude, false)
    map?.flyTo({ center: [suggestion.longitude, suggestion.latitude], zoom: 17 })
  }
}

watch(catalogQuery, (query) => {
  if (catalogTimer) clearTimeout(catalogTimer)
  catalogTimer = setTimeout(() => searchCatalog(query), 350)
})

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
  if (catalogTimer) clearTimeout(catalogTimer)
  catalogController?.abort()
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
    <div class="absolute top-3 right-14 left-3 z-10" :class="{ hidden: fallback }">
      <label for="camera-catalog-search" class="sr-only">Buscar na Base georreferenciada oficial</label>
      <div class="relative max-w-xl">
        <input
          id="camera-catalog-search"
          v-model="catalogQuery"
          type="search"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          :aria-expanded="catalogSuggestions.length > 0"
          aria-controls="camera-catalog-suggestions"
          class="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-900 shadow-md focus-visible:outline-2 focus-visible:outline-[#2768CA]"
          placeholder="Buscar rua ou número no catálogo Aqua"
          @keydown.escape="closeCatalogSuggestions"
        />
        <span v-if="catalogLoading" class="absolute top-3 right-3 text-xs text-slate-500">…</span>
        <ul
          v-if="catalogSuggestions.length"
          id="camera-catalog-suggestions"
          role="listbox"
          class="mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl"
        >
          <li v-for="suggestion in catalogSuggestions" :key="`${suggestion.kind}-${suggestion.id}`" role="option">
            <button type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none" @click="chooseCatalogSuggestion(suggestion)">
              {{ suggestion.label }}
            </button>
          </li>
        </ul>
        <p v-if="catalogUnavailable" class="mt-1 rounded-lg bg-white/95 px-3 py-2 text-xs text-amber-800 shadow">
          Catálogo Aqua indisponível. A busca do mapa e o preenchimento manual continuam disponíveis.
        </p>
        <p v-else-if="catalogQuery.trim().length >= 3 && !cityId" class="mt-1 rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700 shadow">
          Selecione uma cidade para pesquisar na Base georreferenciada oficial.
        </p>
      </div>
    </div>
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
