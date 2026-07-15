<script setup lang="ts">
import { computed, ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useGeolocationStore } from '@/stores/geolocation'
import { useFloodPointsMap } from '@/composables/useFloodPointsMap'
import { useMachineLearningMap } from '@/composables/useMachineLearningMap'
import { InfoPoints, LayersFilters, DataMapboxPopup, HeaderMapbox } from '@/components'
import { useNeighborhood } from '@/composables/neighborhood'
import { useScreenSize } from '@/composables/screenSize'
import type { FloodPointFeatureCollection } from '@/types/floodPoints'
import type { FeatureCollection, Point } from 'geojson'
import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'
import { useFloodPointDraftStore } from '@/stores/FloodPointDraft'
import { useLoadingStore } from '@/stores/loading'

const FLOOD_SOURCE_ID = 'flood-points-source'
const FLOOD_FILL_LAYER_ID = 'flood-points-fill'
const FLOOD_OUTLINE_LAYER_ID = 'flood-points-outline'
const ML_SOURCE_ID = 'ml-predictions-source'
const ML_LAYER_ID = 'ml-predictions-layer'

mapboxgl.accessToken = String(import.meta.env.VITE_MAPBOX_API_KEY)

const props = defineProps({
  showItems: {
    type: Boolean,
    default: false,
  },
  draftProbability: {
    type: Number,
    default: null,
  },
})

const route = useRoute()
const geolocation = useGeolocationStore()
const { loadNeighborhoods, getLocalization } = useNeighborhood()
const { activeGeoJson, selectFlood, clearSelectedFlood, selectedFlood } = useFloodPointsMap()
const { geoJson: mlGeoJson } = useMachineLearningMap()
const { isMobile } = useScreenSize()
const ctrl = useFloodCameraMonitoringStore()
const floodDraft = useFloodPointDraftStore()
const isRegisterRoute = computed(() => String(route.name) === 'Registrar ponto')
const loadingStore = useLoadingStore()
const neighborhood = ref<string | null>(null)
const city = ref<string | null>(null)
const probability = ref<number | null>(null)
const showPopup = ref<boolean>(false)
const mapRef = ref<mapboxgl.Map | null>(null)
const geocoderRef = ref<MapboxGeocoder | null>(null)
const isGeocoderAdded = ref(false)
const cameraMarkers = ref<mapboxgl.Marker[]>([])
const drawRef = ref<MapboxDraw | null>(null)
const isDrawing = ref(false)
const markingMode = ref<'polygon' | 'radius' | null>(null)
const polygonVertexCount = ref(0)
const activePolygonId = ref<string | number | null>(null)
const radiusMeters = ref(80)
const radiusClickHandler = ref<((event: mapboxgl.MapMouseEvent) => void) | null>(null)
const isLocating = ref(false)
const mapReady = ref(false)
let radiusHandle: mapboxgl.Marker | null = null

const draftColor = computed(() => {
  const probability = props.draftProbability
  if (probability === null || probability <= 40) return '#46A758'
  if (probability <= 70) return '#E0B400'
  return '#E5484D'
})

const updateDraftColor = () => {
  const map = mapRef.value
  if (!map?.loaded()) return

  const color = draftColor.value
  const fillLayers = ['gl-draw-polygon-fill-inactive', 'gl-draw-polygon-fill-active']
  const lineLayers = ['gl-draw-polygon-stroke-inactive', 'gl-draw-polygon-stroke-active']

  fillLayers.forEach((layer) => {
    if (map.getLayer(layer)) map.setPaintProperty(layer, 'fill-color', color)
  })
  lineLayers.forEach((layer) => {
    if (map.getLayer(layer)) map.setPaintProperty(layer, 'line-color', color)
  })
}

const syncDrawFeatures = () => {
  const draw = drawRef.value
  if (!draw) return
  const data = draw.getAll()
  const features = Array.isArray(data?.features) ? data.features : []
  floodDraft.setDrawFeatures(features)
}

const buildRadiusFeature = (
  center: [number, number],
  radius: number,
  featureId?: string | number,
) => {
  const feature = turf.circle(center, radius / 1000, {
    steps: 64,
    units: 'kilometers',
    properties: {
      aquaShape: 'radius',
      radiusCenter: center,
      radiusMeters: radius,
    },
  })
  if (featureId !== undefined) feature.id = featureId
  return feature
}

const radiusEdge = (center: [number, number], radius: number) => {
  const point = turf.destination(turf.point(center), radius / 1000, 90, {
    units: 'kilometers',
  })
  return point.geometry.coordinates as [number, number]
}

const removeRadiusHandle = () => {
  radiusHandle?.remove()
  radiusHandle = null
}

const attachRadiusHandle = (
  center: [number, number],
  featureId: string | number,
  initialRadius: number,
) => {
  const map = mapRef.value
  const draw = drawRef.value
  if (!map || !draw) return

  removeRadiusHandle()
  radiusMeters.value = initialRadius

  const element = document.createElement('button')
  element.type = 'button'
  element.title = 'Arraste para aumentar ou reduzir o raio'
  element.setAttribute('aria-label', 'Redimensionar raio da área')
  element.textContent = `${initialRadius} m`
  element.style.minWidth = '48px'
  element.style.height = '34px'
  element.style.padding = '0 8px'
  element.style.border = '3px solid white'
  element.style.borderRadius = '9999px'
  element.style.background = '#2768CA'
  element.style.color = 'white'
  element.style.fontWeight = '700'
  element.style.cursor = 'ew-resize'
  element.style.boxShadow = '0 4px 12px rgba(0, 24, 47, 0.3)'

  const marker = new mapboxgl.Marker({ element, draggable: true })
    .setLngLat(radiusEdge(center, initialRadius))
    .addTo(map)

  marker.on('drag', () => {
    const position = marker.getLngLat()
    const measured = turf.distance(turf.point(center), turf.point([position.lng, position.lat]), {
      units: 'meters',
    })
    const nextRadius = Math.round(Math.min(500, Math.max(20, measured)))
    radiusMeters.value = nextRadius
    draw.add(buildRadiusFeature(center, nextRadius, featureId))
    syncDrawFeatures()
    element.textContent = `${nextRadius} m`
    element.title = `Raio: ${nextRadius} m. Arraste para redimensionar.`
  })

  marker.on('dragend', () => {
    marker.setLngLat(radiusEdge(center, radiusMeters.value))
  })

  radiusHandle = marker
}

const stopRadiusDrawing = () => {
  const map = mapRef.value
  const handler = radiusClickHandler.value
  if (map && handler) map.off('click', handler)
  if (map) map.getCanvas().style.cursor = ''
  radiusClickHandler.value = null
}

const startDrawing = () => {
  const draw = drawRef.value
  if (!draw) return
  stopRadiusDrawing()
  const existingIds = new Set(draw.getAll().features.map((feature) => feature.id))
  draw.changeMode('draw_polygon')
  activePolygonId.value =
    draw.getAll().features.find((feature) => !existingIds.has(feature.id))?.id ?? null
  isDrawing.value = true
  markingMode.value = 'polygon'
  polygonVertexCount.value = 0
}

const startRadiusDrawing = () => {
  const map = mapRef.value
  const draw = drawRef.value
  if (!map || !draw) return

  stopRadiusDrawing()
  draw.changeMode('simple_select')
  activePolygonId.value = null
  isDrawing.value = true
  markingMode.value = 'radius'
  polygonVertexCount.value = 0
  map.getCanvas().style.cursor = 'crosshair'

  const handler = (event: mapboxgl.MapMouseEvent) => {
    const center: [number, number] = [event.lngLat.lng, event.lngLat.lat]
    const [featureId] = draw.add(buildRadiusFeature(center, radiusMeters.value))
    syncDrawFeatures()
    if (featureId !== undefined) {
      attachRadiusHandle(center, featureId, radiusMeters.value)
      draw.changeMode('simple_select', { featureIds: [String(featureId)] })
    }
    stopRadiusDrawing()
    isDrawing.value = false
    markingMode.value = null
    polygonVertexCount.value = 0
  }

  radiusClickHandler.value = handler
  map.once('click', handler)
}

const finishPolygon = () => {
  const draw = drawRef.value
  if (!draw || markingMode.value !== 'polygon' || polygonVertexCount.value < 3) return
  const featureIds = activePolygonId.value === null ? [] : [String(activePolygonId.value)]
  draw.changeMode('simple_select', { featureIds })
  queueMicrotask(() => {
    if (draw.getMode() !== 'simple_select') {
      draw.changeMode('simple_select', { featureIds })
    }
  })
  syncDrawFeatures()
  isDrawing.value = false
  markingMode.value = null
  polygonVertexCount.value = 0
  activePolygonId.value = null
}

const editDrawing = () => {
  const draw = drawRef.value
  const firstFeature = draw?.getAll().features[0]
  if (!draw || firstFeature?.id === undefined) return
  draw.changeMode('direct_select', { featureId: String(firstFeature.id) })
}

const cancelDrawing = () => {
  const draw = drawRef.value
  stopRadiusDrawing()
  if (draw && markingMode.value === 'polygon') {
    draw.trash()
    draw.changeMode('simple_select')
    syncDrawFeatures()
  }
  isDrawing.value = false
  markingMode.value = null
  polygonVertexCount.value = 0
  activePolygonId.value = null
}

const clearDrawing = () => {
  const draw = drawRef.value
  if (!draw) return
  stopRadiusDrawing()
  removeRadiusHandle()
  draw.deleteAll()
  floodDraft.clearDraft()
  isDrawing.value = false
  markingMode.value = null
  polygonVertexCount.value = 0
  activePolygonId.value = null
}

const centerOnUserLocation = () => {
  const map = mapRef.value
  if (!map || !navigator.geolocation) return

  isLocating.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 16, pitch: 0, bearing: 0 })
      isLocating.value = false
    },
    () => {
      isLocating.value = false
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

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
    ; (source as mapboxgl.GeoJSONSource).setData(data)
}

// --- Machine Learning Layer: pontos ---
const addMachineLearningLayer = (map: mapboxgl.Map, data: FeatureCollection<Point>) => {
  if (!map.getSource(ML_SOURCE_ID)) {
    map.addSource(ML_SOURCE_ID, {
      type: 'geojson',
      data,
    })
  }

  if (!map.getLayer(ML_LAYER_ID)) {
    map.addLayer({
      id: ML_LAYER_ID,
      type: 'heatmap',
      source: ML_SOURCE_ID,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'probability'], 0, 0, 100, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 16, 3],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(33,102,172,0)',
          0.2,
          'rgba(103,169,207,0.6)',
          0.4,
          'rgba(255,225,1,0.7)',
          0.6,
          'rgba(255,140,0,0.8)',
          0.8,
          'rgba(255,77,77,0.9)',
          1,
          'rgb(178,24,43)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 16, 40],
        'heatmap-opacity': 0.8,
      },
    })
  }
}

const updateMLSource = (map: mapboxgl.Map, data: FeatureCollection<Point>) => {
  const source = map.getSource(ML_SOURCE_ID)
  if (!source) return
    ; (source as mapboxgl.GeoJSONSource).setData(data)
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

  const marker = new mapboxgl.Marker(el).setLngLat([lng, lat])

  if (ctrl.showCameras) {
    marker.addTo(map)
  }

  cameraMarkers.value.push(marker)
}

onMounted(async () => {
  loadingStore.start()
  await loadNeighborhoods()

  const map = new mapboxgl.Map({
    container: 'map-fixed',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [geolocation.longitude ?? -48.8464, geolocation.latitude ?? -26.3044],
    zoom: 13,
    pitch: isRegisterRoute.value ? 0 : 60,
    bearing: isRegisterRoute.value ? 0 : -30,
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
    mapReady.value = true
    addFloodLayers(map, activeGeoJson.value)
    addMachineLearningLayer(map, mlGeoJson.value)

    ctrl.camerasRaw.forEach((camera) => {
      if (camera.latitude && camera.longitude) {
        addCustomMarker(map, camera.longitude, camera.latitude, camera.id)
      } else {
        console.warn('Câmera sem coordenadas:', camera)
      }
    })

    map.on('click', (e) => {
      if (markingMode.value === 'polygon') polygonVertexCount.value += 1
      const hasFloodLayer = Boolean(map.getLayer(FLOOD_FILL_LAYER_ID))
      const hasMLLayer = Boolean(map.getLayer(ML_LAYER_ID))

      const renderedFlood = hasFloodLayer
        ? map.queryRenderedFeatures(e.point, {
          layers: [FLOOD_FILL_LAYER_ID],
        })
        : []
      const renderedML = hasMLLayer
        ? map.queryRenderedFeatures(e.point, {
          layers: [ML_LAYER_ID],
        })
        : []
      if (renderedFlood.length > 0) {
        const first = renderedFlood[0]
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
      if (renderedML.length > 0) {
        const first = renderedML[0]
        if (!first) return
        // ML prediction properties: id, probability, date, flood
        neighborhood.value = null
        city.value = null
        probability.value = extractProbability(first.properties?.probability)
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

    if (isRegisterRoute.value) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        defaultMode: 'simple_select',
      })
      map.addControl(draw, 'top-right')
      drawRef.value = draw

      if (floodDraft.drawnFeatures.length > 0) {
        draw.add({
          type: 'FeatureCollection',
          features: floodDraft.drawnFeatures,
        })

        const storedRadius = [...floodDraft.drawnFeatures]
          .reverse()
          .find((feature) => feature.properties?.aquaShape === 'radius')
        const storedCenter = storedRadius?.properties?.radiusCenter
        const storedMeters = Number(storedRadius?.properties?.radiusMeters)
        if (
          storedRadius?.id !== undefined &&
          Array.isArray(storedCenter) &&
          storedCenter.length === 2 &&
          storedCenter.every((coordinate) => typeof coordinate === 'number') &&
          Number.isFinite(storedMeters)
        ) {
          attachRadiusHandle(
            storedCenter as [number, number],
            storedRadius.id,
            Math.min(500, Math.max(20, storedMeters)),
          )
        }
      }

      syncDrawFeatures()
      map.on('draw.create', () => {
        syncDrawFeatures()
        isDrawing.value = false
        markingMode.value = null
        polygonVertexCount.value = 0
        activePolygonId.value = null
        map.getCanvas().style.cursor = ''
      })
      map.on('draw.update', syncDrawFeatures)
      map.on('draw.delete', syncDrawFeatures)
      updateDraftColor()
    }
  })

  loadingStore.stop()

  watch(
    isMobile,
    (mobile) => {
      const shouldShowGeocoder = isRegisterRoute.value || !mobile
      if (!shouldShowGeocoder) {
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

  watch(draftColor, updateDraftColor)
  watch(
    mlGeoJson,
    (nextGeoJson) => {
      if (!mapRef.value?.loaded()) return
      if (!mapRef.value.getSource(ML_SOURCE_ID)) {
        addMachineLearningLayer(mapRef.value, nextGeoJson)
        return
      }
      updateMLSource(mapRef.value, nextGeoJson)
    },
    { deep: true },
  )
  watch(selectedFlood, (flood) => {
    if (!flood) return
    neighborhood.value = flood.neighborhood
    city.value = flood.city
    probability.value = flood.probability
  })

  watch(
    () => ctrl.showCameras,
    (visible) => {
      const map = mapRef.value
      if (!map) return

      cameraMarkers.value.forEach((marker) => {
        if (visible) {
          marker.addTo(map)
        } else {
          marker.remove()
        }
      })
    },
  )
})

onBeforeUnmount(() => {
  stopRadiusDrawing()
  removeRadiusHandle()
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
  cameraMarkers.value = []
})
</script>

<template>
  <div class="relative w-full overflow-hidden rounded-2xl" :class="isRegisterRoute
      ? 'h-[62vh] min-h-120 lg:h-[calc(100vh-11rem)]'
      : 'h-dvh min-h-150 md:h-[42vw]'
    ">
    <div id="map-fixed" class="h-full w-full overflow-hidden md:rounded-2xl"></div>

    <template v-if="isRegisterRoute">
      <div
        class="absolute top-20 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:bg-[#00182F]/95 md:top-3 md:left-1/2 md:-translate-x-1/2"
        @pointerdown.stop @click.stop>
        <p class="flex items-start gap-2 text-xs font-medium md:text-sm">
          <span class="material-symbols-outlined text-lg text-[#2768CA]">gesture</span>
          <span v-if="markingMode === 'radius'">Escolha o raio e toque no centro do alagamento para demarcar a
            área.</span>
          <span v-else-if="isDrawing">Marque os limites da área e toque no primeiro ponto para concluir.</span>
          <span v-else-if="floodDraft.hasGeometry">Área marcada. Arraste os pontos para ajustar o contorno.</span>
          <span v-else>Busque um endereço e marque no mapa a área afetada.</span>
        </p>
        <div v-if="markingMode === 'radius'" class="mt-3 border-t border-[#DCDCDC] pt-3">
          <div class="flex items-center justify-between gap-4 text-xs">
            <label for="radius-size" class="font-semibold">Raio da área</label>
            <strong class="text-[#2768CA]">{{ radiusMeters }} m</strong>
          </div>
          <input id="radius-size" v-model.number="radiusMeters" type="range" min="20" max="500" step="10"
            class="mt-2 w-full accent-[#2768CA]" />
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button v-for="radius in [30, 50, 80, 150, 300, 500]" :key="radius" type="button"
              class="rounded-full border px-2.5 py-1 text-[10px] font-semibold" :class="radiusMeters === radius
                  ? 'border-[#2768CA] bg-[#2768CA] text-white'
                  : 'border-[#7AA6C8] text-[#2768CA]'
                " @click.stop="radiusMeters = radius">
              {{ radius }} m
            </button>
          </div>
        </div>
      </div>

      <div class="absolute right-3 bottom-5 z-10 flex flex-col items-end gap-2">
        <button type="button"
          class="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#2768CA] shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60 dark:bg-[#00182F]"
          :disabled="!mapReady || isLocating" @click.stop="centerOnUserLocation">
          <span class="material-symbols-outlined text-xl">my_location</span>
          {{ isLocating ? 'Localizando...' : 'Minha localização' }}
        </button>
        <div class="flex max-w-[calc(100vw-1.5rem)] flex-wrap justify-end gap-2" @pointerdown.stop @click.stop>
          <button v-if="markingMode === 'polygon'" type="button"
            class="flex items-center gap-2 rounded-full bg-[#2768CA] px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:bg-[#9CA3AF]"
            :disabled="polygonVertexCount < 3" :title="polygonVertexCount < 3 ? 'Marque pelo menos três pontos' : 'Fechar e salvar a área'
              " @click.stop="finishPolygon">
            <span class="material-symbols-outlined text-xl">check</span>
            {{ polygonVertexCount < 3 ? `${polygonVertexCount}/3 pontos` : 'Fechar polígono' }} </button>
              <button v-if="isDrawing" type="button"
                class="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#DC2626] shadow-lg dark:bg-[#00182F]"
                @click.stop="cancelDrawing">
                <span class="material-symbols-outlined text-xl">close</span>
                Cancelar
              </button>
              <button v-if="floodDraft.hasGeometry && !isDrawing" type="button"
                class="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#2768CA] shadow-lg dark:bg-[#00182F]"
                @click.stop="editDrawing">
                <span class="material-symbols-outlined text-xl">edit</span>
                Ajustar
              </button>
              <button v-if="floodDraft.hasGeometry" type="button"
                class="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#DC2626] shadow-lg dark:bg-[#00182F]"
                @click.stop="clearDrawing">
                <span class="material-symbols-outlined text-xl">restart_alt</span>
                Recomeçar
              </button>
              <button v-if="!isDrawing" type="button"
                class="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#2768CA] shadow-lg transition-colors hover:bg-[#2768CA]/10 disabled:opacity-60 dark:bg-[#00182F]"
                :disabled="!mapReady" @click.stop="startRadiusDrawing">
                <span class="material-symbols-outlined text-xl">radio_button_checked</span>
                Raio rápido
              </button>
              <button v-if="!isDrawing" type="button"
                class="flex items-center gap-2 rounded-full bg-[#2768CA] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#1f57ad] disabled:opacity-60"
                :disabled="!mapReady" @click.stop="startDrawing">
                <span class="material-symbols-outlined text-xl">{{
                  floodDraft.hasGeometry ? 'add' : 'draw'
                  }}</span>
                {{ floodDraft.hasGeometry ? 'Desenhar outra' : 'Desenhar área' }}
              </button>
        </div>
      </div>
    </template>

    <div v-if="showItems">
      <div v-if="!isMobile">
        <InfoPoints />
        <LayersFilters />
      </div>
      <div v-else class="absolute inset-0 pointer-events-none">
        <div class="pointer-events-auto">
          <HeaderMapbox />
        </div>
        <div class="pointer-events-auto">
          <DataMapboxPopup v-if="showPopup" :city="city" :neighborhood="neighborhood" :probability="probability" />
        </div>
      </div>
    </div>
  </div>
</template>
