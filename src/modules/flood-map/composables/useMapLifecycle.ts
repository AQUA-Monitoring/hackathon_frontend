import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import type { FeatureCollection, Point } from 'geojson'
import type { FloodPointFeatureCollection } from '@/modules/flood-points'
import {
  AQUA_TERRITORY_BBOX, AQUA_TERRITORY_BOUNDS, AQUA_TERRITORY_CENTER,
  AQUA_TERRITORY_ZOOM, isInsideAquaTerritory,
} from '@/utils/aquaTerritory'

mapboxgl.accessToken = String(import.meta.env.VITE_MAPBOX_API_KEY)

export const useMapLifecycle = (options: {
  containerRef: Ref<HTMLElement | null>
  mapRef: Ref<mapboxgl.Map | null>
  isRegisterRoute: Ref<boolean>
  isMobile: Ref<boolean>
  longitude: Ref<number | null | undefined> | { value: number | null | undefined }
  latitude: Ref<number | null | undefined> | { value: number | null | undefined }
  activeGeoJson: Ref<FloodPointFeatureCollection>
  mlGeoJson: Ref<FeatureCollection<Point>>
  selectedFlood: Ref<unknown>
  showCameras: Ref<boolean>
  loadNeighborhoods: () => Promise<unknown>
  startLoading: () => void
  stopLoading: () => void
  syncFlood: (map: mapboxgl.Map, data: FloodPointFeatureCollection) => void
  syncMachineLearning: (map: mapboxgl.Map, data: FeatureCollection<Point>) => void
  setupMarkers: (map: mapboxgl.Map) => void
  setMarkersVisible: (map: mapboxgl.Map, visible: boolean) => void
  cleanupMarkers: () => void
  handleMapClick: (map: mapboxgl.Map, event: mapboxgl.MapMouseEvent) => void
  syncSelectedFlood: () => void
  setupDrawing: (map: mapboxgl.Map) => void
  cleanupDrawing: () => void
  countPolygonVertex: () => void
  updateDraftColor: () => void
  draftColor: Ref<string>
}) => {
  const mapRef = options.mapRef
  const mapReady = ref(false)
  let geocoder: MapboxGeocoder | null = null
  let geocoderAdded = false
  let handleClick: ((event: mapboxgl.MapMouseEvent) => void) | null = null

  const syncGeocoder = (mobile: boolean) => {
    const map = mapRef.value
    if (!map || !geocoder) return
    const shouldShow = options.isRegisterRoute.value || !mobile
    if (shouldShow && !geocoderAdded) {
      map.addControl(geocoder, 'top-left')
      geocoderAdded = true
    } else if (!shouldShow && geocoderAdded) {
      map.removeControl(geocoder)
      geocoderAdded = false
    }
  }

  onMounted(async () => {
    const container = options.containerRef.value
    if (!container) return
    options.startLoading()
    try {
      await options.loadNeighborhoods()
      const candidate: [number, number] = [
        options.longitude.value ?? AQUA_TERRITORY_CENTER[0],
        options.latitude.value ?? AQUA_TERRITORY_CENTER[1],
      ]
      const map = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: isInsideAquaTerritory(candidate) ? candidate : AQUA_TERRITORY_CENTER,
        zoom: AQUA_TERRITORY_ZOOM,
        pitch: options.isRegisterRoute.value ? 0 : 60,
        bearing: options.isRegisterRoute.value ? 0 : -30,
        antialias: true,
        maxBounds: AQUA_TERRITORY_BOUNDS,
      })
      mapRef.value = map
      geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken!,
        mapboxgl: mapboxgl as unknown as typeof import('mapbox-gl'),
        marker: false,
        placeholder: 'Buscar local...',
        countries: 'br',
        bbox: AQUA_TERRITORY_BBOX,
      })
      syncGeocoder(options.isMobile.value)
      map.on('load', () => {
        mapReady.value = true
        options.syncFlood(map, options.activeGeoJson.value)
        options.syncMachineLearning(map, options.mlGeoJson.value)
        options.setupMarkers(map)
        handleClick = (event) => {
          options.countPolygonVertex()
          options.handleMapClick(map, event)
        }
        map.on('click', handleClick)
        if (options.isRegisterRoute.value) options.setupDrawing(map)
      })
    } finally {
      options.stopLoading()
    }
  })

  watch(options.isMobile, syncGeocoder, { immediate: true })
  watch(options.activeGeoJson, (data) => {
    const map = mapRef.value
    if (map?.loaded()) options.syncFlood(map, data)
  }, { deep: true })
  watch(options.mlGeoJson, (data) => {
    const map = mapRef.value
    if (map?.loaded()) options.syncMachineLearning(map, data)
  }, { deep: true })
  watch(options.selectedFlood, options.syncSelectedFlood)
  watch(options.showCameras, (visible) => {
    const map = mapRef.value
    if (map) options.setMarkersVisible(map, visible)
  })
  watch(options.draftColor, options.updateDraftColor)

  onBeforeUnmount(() => {
    const map = mapRef.value
    if (!map) return
    options.cleanupDrawing()
    options.cleanupMarkers()
    if (handleClick) map.off('click', handleClick)
    if (geocoder && geocoderAdded) map.removeControl(geocoder)
    map.remove()
    handleClick = null
    geocoder = null
    geocoderAdded = false
    mapReady.value = false
    mapRef.value = null
  })

  return { mapRef, mapReady }
}
