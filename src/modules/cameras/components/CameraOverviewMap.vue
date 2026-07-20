<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mapboxgl, { type MapLayerMouseEvent } from 'mapbox-gl'
import type { FeatureCollection, Point } from 'geojson'
import type { CameraApiItem } from '../types/camera'
import {
  cameraAddressLabel,
  cameraCoordinates,
  cameraPresentation,
} from '../utils/cameraPresentation'
import {
  AQUA_TERRITORY_BOUNDS,
  AQUA_TERRITORY_CENTER,
  AQUA_TERRITORY_ZOOM,
  isInsideAquaTerritory,
} from '@/shared'
import 'mapbox-gl/dist/mapbox-gl.css'

const SOURCE_ID = 'aqua-camera-overview'
const CLUSTER_LAYER_ID = 'aqua-camera-clusters'
const CLUSTER_COUNT_LAYER_ID = 'aqua-camera-cluster-count'
const CAMERA_LAYER_ID = 'aqua-camera-points'
const SELECTED_LAYER_ID = 'aqua-camera-selected'

const props = defineProps<{ cameras: CameraApiItem[]; selectedId?: string | null }>()
const emit = defineEmits<{ select: [camera: CameraApiItem] }>()
const containerRef = ref<HTMLDivElement | null>(null)
const fallback = ref(false)
let map: mapboxgl.Map | null = null

function markerIcon(camera: CameraApiItem) {
  if (camera.status !== 'ACTIVE' || camera.operational.stream.status !== 'ONLINE') {
    return 'camera-neutral'
  }
  const classification = camera.operational.analysis.classification
  if (classification === 'FLOOD_INDICATION') return 'camera-flood'
  if (classification === 'INTERMEDIATE_INDICATION') return 'camera-medium'
  if (classification === 'NO_INDICATION') return 'camera-normal'
  return 'camera-neutral'
}
function markerColor(camera: CameraApiItem) {
  const colors = {
    risk: '#DC2626',
    attention: '#D97706',
    safe: '#059669',
    neutral: '#64748B',
    muted: '#94A3B8',
  }
  return colors[cameraPresentation(camera).tone]
}

function featureCollection(): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: props.cameras.flatMap((camera) => {
      const coordinates = cameraCoordinates(camera)
      if (!coordinates || !isInsideAquaTerritory(coordinates)) return []
      return [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates },
          properties: {
            id: camera.id,
            color: markerColor(camera),
            icon: markerIcon(camera),
            label: cameraPresentation(camera).label,
          },
        },
      ]
    }),
  }
}

function updateSource() {
  const source = map?.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
  source?.setData(featureCollection())
  if (map?.getLayer(SELECTED_LAYER_ID)) {
    map.setFilter(SELECTED_LAYER_ID, ['==', ['get', 'id'], props.selectedId ?? ''])
  }
}

function handleCameraClick(event: MapLayerMouseEvent) {
  const feature = event.features?.[0]
  const id = String(feature?.properties?.id ?? '')
  const camera = props.cameras.find((item) => item.id === id)
  if (camera) emit('select', camera)
}

function handleClusterClick(event: MapLayerMouseEvent) {
  if (!map) return
  const feature = map.queryRenderedFeatures(event.point, { layers: [CLUSTER_LAYER_ID] })[0]
  const clusterId = Number(feature?.properties?.cluster_id)
  const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
  if (!source || !Number.isFinite(clusterId) || feature?.geometry.type !== 'Point') return
  source.getClusterExpansionZoom(clusterId, (error, zoom) => {
    if (error || !map || zoom === null || zoom === undefined) return
    if (feature.geometry.type !== 'Point') return
    map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom })
  })
}

onMounted(() => {
  const token = String(import.meta.env.VITE_MAPBOX_API_KEY ?? '')
  if (!containerRef.value || !token) {
    fallback.value = true
    return
  }

  try {
    mapboxgl.accessToken = token
    const firstCoordinates =
      props.cameras
        .map(cameraCoordinates)
        .find((value): value is [number, number] => !!value && isInsideAquaTerritory(value)) ??
      AQUA_TERRITORY_CENTER
    map = new mapboxgl.Map({
      container: containerRef.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: firstCoordinates as [number, number],
      zoom: AQUA_TERRITORY_ZOOM,
      maxBounds: AQUA_TERRITORY_BOUNDS,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('error', () => {
      if (!map?.loaded()) fallback.value = true
    })
    map.on('load', () => {
      if (!map) return
      const icons: Array<[string, string]> = [
        ['camera-normal', '/icons/camera_icon_normal.svg'],
        ['camera-medium', '/icons/camera_icon_medium.svg'],
        ['camera-flood', '/icons/camera_icon_flood.svg'],
        ['camera-neutral', '/icons/camera_icon_neutral.svg'],
      ]
      let pending = icons.length
      for (const [name, url] of icons)
        map.loadImage(url, (error, image) => {
          if (!error && image && map && !map.hasImage(name)) map.addImage(name, image)
          if (--pending === 0) addCameraLayers()
        })
      const addCameraLayers = () => {
        if (!map || map.getLayer(CAMERA_LAYER_ID)) return
        map.addLayer({
          id: CAMERA_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          layout: { 'icon-image': ['get', 'icon'], 'icon-size': 0.65, 'icon-allow-overlap': true },
        })
        map.addLayer({
          id: SELECTED_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['==', ['get', 'id'], props.selectedId ?? ''],
          paint: {
            'circle-color': 'rgba(0,0,0,0)',
            'circle-radius': 19,
            'circle-stroke-color': '#2768CA',
            'circle-stroke-width': 4,
          },
        })
        map.on('click', CAMERA_LAYER_ID, handleCameraClick)
        for (const layer of [CAMERA_LAYER_ID, CLUSTER_LAYER_ID]) {
          map.on('mouseenter', layer, () => {
            if (map) map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', layer, () => {
            if (map) map.getCanvas().style.cursor = ''
          })
        }
      }
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: featureCollection(),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 48,
      })
      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#2768CA',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 25, 40, 31],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 3,
        },
      })
      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13 },
        paint: { 'text-color': '#FFFFFF' },
      })
      map.on('click', CLUSTER_LAYER_ID, handleClusterClick)
      if (pending === 0) addCameraLayers()
    })
  } catch {
    fallback.value = true
  }
})

watch(() => props.cameras, updateSource, { deep: true })
watch(() => props.selectedId, updateSource)

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="relative h-full min-h-100 overflow-hidden rounded-3xl bg-slate-100 dark:bg-[#071F36]">
    <div ref="containerRef" class="h-full min-h-100 w-full" :class="{ hidden: fallback }"></div>
    <div
      v-if="fallback"
      class="absolute inset-0 overflow-y-auto p-5"
      role="region"
      aria-label="Câmeras sem mapa"
    >
      <div class="mx-auto max-w-md rounded-2xl bg-white/95 p-4 shadow dark:bg-[#00182F]/95">
        <p class="font-semibold">Mapa indisponível</p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
          As câmeras com localização continuam acessíveis nesta lista territorial.
        </p>
        <ul class="mt-4 grid gap-2">
          <li v-for="camera in cameras.filter((item) => cameraCoordinates(item))" :key="camera.id">
            <button
              type="button"
              class="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-[#2768CA] focus-visible:outline-3 focus-visible:outline-[#2768CA] dark:border-slate-700"
              @click="emit('select', camera)"
            >
              <span class="block font-semibold">{{ camera.description }}</span>
              <span
                v-if="camera.status === 'OFFLINE'"
                class="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Câmera offline
              </span>
              <span
                v-if="camera.status === 'OFFLINE'"
                class="mt-1 block text-xs text-slate-500 dark:text-slate-400"
              >
                Sem análise automática · somente transmissão
              </span>
              <span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">{{
                cameraAddressLabel(camera)
              }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
