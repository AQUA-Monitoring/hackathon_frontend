<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mapboxgl, { type GeoJSONSource, type MapMouseEvent } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { HotspotCollection, ImpactLineCollection } from '../types/floodImpact'
import {
  AQUA_TERRITORY_BOUNDS,
  AQUA_TERRITORY_CENTER,
  AQUA_TERRITORY_ZOOM,
  isInsideAquaTerritory,
} from '@/utils/aquaTerritory'

const props = defineProps<{
  footprint: MultiPolygon | null
  affectedRoads: ImpactLineCollection
  hotspots: HotspotCollection
  editable?: boolean
}>()
const emit = defineEmits<{
  'update:footprint': [value: MultiPolygon | null]
  'select-hotspot': [id: string]
  invalid: [message: string]
}>()

const container = ref<HTMLDivElement | null>(null)
const fallback = ref(false)
let map: mapboxgl.Map | null = null
let draw: MapboxDraw | null = null

function toMultiPolygon(feature: Feature<Polygon | MultiPolygon>): MultiPolygon {
  return feature.geometry.type === 'MultiPolygon'
    ? feature.geometry
    : { type: 'MultiPolygon', coordinates: [feature.geometry.coordinates] }
}

function everyCoordinateInside(geometry: MultiPolygon) {
  return geometry.coordinates.every((polygon) =>
    polygon.every((ring) =>
      ring.every((coordinate) => {
        const longitude = coordinate[0]
        const latitude = coordinate[1]
        return longitude !== undefined && latitude !== undefined
          ? isInsideAquaTerritory([longitude, latitude])
          : false
      }),
    ),
  )
}

function readDrawnFootprint() {
  if (!draw) return
  const polygonFeatures = draw.getAll().features.filter(
      (feature: Feature): feature is Feature<Polygon | MultiPolygon> =>
        feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon',
    )
  if (!polygonFeatures.length) {
    emit('update:footprint', null)
    return
  }
  const coordinates = polygonFeatures.flatMap((feature) => toMultiPolygon(feature).coordinates)
  const footprint: MultiPolygon = { type: 'MultiPolygon', coordinates }
  if (!everyCoordinateInside(footprint)) {
    emit('invalid', 'A mancha deve permanecer dentro da área atendida pelo Aqua.')
    return
  }
  emit('update:footprint', footprint)
}

function replaceDrawnFootprint(footprint: MultiPolygon | null) {
  if (!draw) return
  draw.deleteAll()
  if (footprint) draw.add({ type: 'Feature', properties: {}, geometry: footprint })
}

function updateSource(id: string, data: ImpactLineCollection | HotspotCollection) {
  const source = map?.getSource(id) as GeoJSONSource | undefined
  source?.setData(data)
}

function selectHotspot(event: MapMouseEvent) {
  const id = event.features?.[0]?.properties?.id
  if (typeof id === 'string') emit('select-hotspot', id)
}

onMounted(() => {
  const token = String(import.meta.env.VITE_MAPBOX_API_KEY ?? '')
  if (!container.value || !token) {
    fallback.value = true
    return
  }
  try {
    mapboxgl.accessToken = token
    map = new mapboxgl.Map({
      container: container.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: AQUA_TERRITORY_CENTER,
      zoom: AQUA_TERRITORY_ZOOM,
      maxBounds: AQUA_TERRITORY_BOUNDS,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    if (props.editable) {
      draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      })
      map.addControl(draw, 'top-left')
      map.on('draw.create', readDrawnFootprint)
      map.on('draw.update', readDrawnFootprint)
      map.on('draw.delete', readDrawnFootprint)
    }
    map.on('load', () => {
      map?.addSource('affected-roads', { type: 'geojson', data: props.affectedRoads })
      map?.addLayer({
        id: 'affected-roads-line',
        type: 'line',
        source: 'affected-roads',
        paint: {
          'line-color': [
            'match',
            ['get', 'evidence_kind'],
            'CONFIRMED_OCCURRENCE',
            '#dc2626',
            'CAMERA_OBSERVATION',
            '#ea580c',
            'USER_REPORT',
            '#ca8a04',
            '#2768CA',
          ],
          'line-width': 6,
          'line-opacity': 0.9,
        },
      })
      map?.addSource('flood-hotspots', { type: 'geojson', data: props.hotspots })
      map?.addLayer({
        id: 'flood-hotspots-fill',
        type: 'fill',
        source: 'flood-hotspots',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': '#dc2626',
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'recurrence_score'], 0],
            0,
            0.12,
            10,
            0.72,
          ],
          'fill-outline-color': '#991b1b',
        },
      })
      map?.addLayer({
        id: 'flood-hotspots-line',
        type: 'line',
        source: 'flood-hotspots',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: { 'line-color': '#991b1b', 'line-width': 5 },
      })
      map?.addLayer({
        id: 'flood-hotspots-point',
        type: 'circle',
        source: 'flood-hotspots',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-color': '#dc2626',
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'recurrence_score'], 0],
            0,
            6,
            10,
            18,
          ],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
        },
      })
      for (const layer of ['flood-hotspots-fill', 'flood-hotspots-line', 'flood-hotspots-point']) {
        map?.on('click', layer, selectHotspot)
        map?.on('mouseenter', layer, () => {
          if (map) map.getCanvas().style.cursor = 'pointer'
        })
        map?.on('mouseleave', layer, () => {
          if (map) map.getCanvas().style.cursor = ''
        })
      }
      replaceDrawnFootprint(props.footprint)
    })
  } catch {
    fallback.value = true
  }
})

watch(() => props.affectedRoads, (value) => updateSource('affected-roads', value), { deep: true })
watch(() => props.hotspots, (value) => updateSource('flood-hotspots', value), { deep: true })
watch(() => props.footprint, replaceDrawnFootprint, { deep: true })

onBeforeUnmount(() => {
  map?.remove()
  map = null
  draw = null
})
</script>

<template>
  <div class="relative min-h-[32rem] overflow-hidden rounded-3xl bg-slate-100 dark:bg-[#071F36]">
    <div ref="container" class="h-[32rem] w-full lg:h-[44rem]" :class="{ hidden: fallback }"></div>
    <div v-if="fallback" class="grid h-[32rem] place-items-center px-6 text-center lg:h-[44rem]">
      <div>
        <span class="material-symbols-outlined text-5xl text-slate-400" aria-hidden="true">map</span>
        <p class="mt-2 font-semibold">Mapa territorial indisponível</p>
        <p class="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Configure a chave do Mapbox para desenhar manchas e visualizar os trechos atingidos.
          Nenhuma geometria será criada automaticamente.
        </p>
      </div>
    </div>
  </div>
</template>
