import { computed, ref, type Ref } from 'vue'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import type { useFloodPointDraftStore } from '@/modules/flood-points'
import { AQUA_TERRITORY_BOUNDS, isInsideAquaTerritory } from '@/shared'

type DraftStore = ReturnType<typeof useFloodPointDraftStore>

export const useFloodAreaDrawing = (
  mapRef: Ref<mapboxgl.Map | null>,
  floodDraft: DraftStore,
  draftProbability: Ref<number | null>,
) => {
  const drawRef = ref<MapboxDraw | null>(null)
  const isDrawing = ref(false)
  const markingMode = ref<'polygon' | 'radius' | null>(null)
  const polygonVertexCount = ref(0)
  const activePolygonId = ref<string | number | null>(null)
  const radiusMeters = ref(80)
  const isLocating = ref(false)
  let radiusClickHandler: ((event: mapboxgl.MapMouseEvent) => void) | null = null
  let radiusHandle: mapboxgl.Marker | null = null

  const draftColor = computed(() => {
    if (draftProbability.value === null || draftProbability.value <= 40) return '#46A758'
    if (draftProbability.value <= 70) return '#E0B400'
    return '#E5484D'
  })
  const sync = () => floodDraft.setDrawFeatures(drawRef.value?.getAll().features ?? [])
  const buildRadius = (center: [number, number], radius: number, id?: string | number) => {
    const feature = turf.circle(center, radius / 1000, {
      steps: 64, units: 'kilometers',
      properties: { aquaShape: 'radius', radiusCenter: center, radiusMeters: radius },
    })
    if (id !== undefined) feature.id = id
    return feature
  }
  const radiusEdge = (center: [number, number], radius: number) =>
    turf.destination(turf.point(center), radius / 1000, 90, { units: 'kilometers' }).geometry
      .coordinates as [number, number]
  const maximumRadius = (center: [number, number]) => {
    const [southWest, northEast] = AQUA_TERRITORY_BOUNDS
    return Math.floor(Math.min(...[
      [southWest[0], center[1]], [northEast[0], center[1]],
      [center[0], southWest[1]], [center[0], northEast[1]],
    ].map((boundary) => turf.distance(turf.point(center), turf.point(boundary), { units: 'meters' }))))
  }
  const removeRadiusHandle = () => { radiusHandle?.remove(); radiusHandle = null }
  const attachRadiusHandle = (center: [number, number], id: string | number, initial: number) => {
    const map = mapRef.value
    const draw = drawRef.value
    if (!map || !draw) return
    removeRadiusHandle()
    const maximum = Math.min(500, maximumRadius(center))
    if (maximum < 20) return
    radiusMeters.value = Math.min(initial, maximum)
    draw.add(buildRadius(center, radiusMeters.value, id))
    const element = document.createElement('button')
    element.type = 'button'
    element.title = 'Arraste para aumentar ou reduzir o raio'
    element.setAttribute('aria-label', 'Redimensionar raio da área')
    element.textContent = `${radiusMeters.value} m`
    Object.assign(element.style, {
      minWidth: '48px', height: '34px', padding: '0 8px', border: '3px solid white',
      borderRadius: '9999px', background: '#2768CA', color: 'white', fontWeight: '700',
      cursor: 'ew-resize', boxShadow: '0 4px 12px rgba(0, 24, 47, 0.3)',
    })
    const marker = new mapboxgl.Marker({ element, draggable: true })
      .setLngLat(radiusEdge(center, radiusMeters.value)).addTo(map)
    marker.on('drag', () => {
      const position = marker.getLngLat()
      const measured = turf.distance(turf.point(center), turf.point([position.lng, position.lat]), { units: 'meters' })
      const next = Math.round(Math.min(maximum, Math.max(20, measured)))
      radiusMeters.value = next
      draw.add(buildRadius(center, next, id))
      sync()
      element.textContent = `${next} m`
      element.title = `Raio: ${next} m. Arraste para redimensionar.`
    })
    marker.on('dragend', () => marker.setLngLat(radiusEdge(center, radiusMeters.value)))
    radiusHandle = marker
  }
  const stopRadiusDrawing = () => {
    const map = mapRef.value
    if (map && radiusClickHandler) map.off('click', radiusClickHandler)
    if (map) map.getCanvas().style.cursor = ''
    radiusClickHandler = null
  }
  const resetState = () => {
    isDrawing.value = false; markingMode.value = null; polygonVertexCount.value = 0; activePolygonId.value = null
  }
  const updateDraftColor = () => {
    const map = mapRef.value
    if (!map?.loaded()) return
    for (const layer of ['gl-draw-polygon-fill-inactive', 'gl-draw-polygon-fill-active'])
      if (map.getLayer(layer)) map.setPaintProperty(layer, 'fill-color', draftColor.value)
    for (const layer of ['gl-draw-polygon-stroke-inactive', 'gl-draw-polygon-stroke-active'])
      if (map.getLayer(layer)) map.setPaintProperty(layer, 'line-color', draftColor.value)
  }
  const setup = (map: mapboxgl.Map) => {
    const draw = new MapboxDraw({ displayControlsDefault: false, defaultMode: 'simple_select' })
    map.addControl(draw, 'top-right')
    drawRef.value = draw
    if (floodDraft.drawnFeatures.length) {
      draw.add({ type: 'FeatureCollection', features: floodDraft.drawnFeatures })
      const stored = [...floodDraft.drawnFeatures].reverse().find((feature) => feature.properties?.aquaShape === 'radius')
      const center = stored?.properties?.radiusCenter
      const meters = Number(stored?.properties?.radiusMeters)
      if (stored?.id !== undefined && Array.isArray(center) && center.length === 2 &&
          center.every((coordinate) => typeof coordinate === 'number') && Number.isFinite(meters))
        attachRadiusHandle(center as [number, number], stored.id, Math.min(500, Math.max(20, meters)))
    }
    sync()
    map.on('draw.create', onDrawCreate)
    map.on('draw.update', sync)
    map.on('draw.delete', sync)
    updateDraftColor()
  }
  const onDrawCreate = () => { sync(); resetState(); if (mapRef.value) mapRef.value.getCanvas().style.cursor = '' }
  const countPolygonVertex = () => { if (markingMode.value === 'polygon') polygonVertexCount.value += 1 }
  const startDrawing = () => {
    const draw = drawRef.value
    if (!draw) return
    stopRadiusDrawing(); draw.changeMode('draw_polygon'); isDrawing.value = true
    markingMode.value = 'polygon'; polygonVertexCount.value = 0
  }
  const startRadiusDrawing = () => {
    const map = mapRef.value; const draw = drawRef.value
    if (!map || !draw) return
    stopRadiusDrawing(); draw.changeMode('simple_select'); activePolygonId.value = null
    isDrawing.value = true; markingMode.value = 'radius'; polygonVertexCount.value = 0
    map.getCanvas().style.cursor = 'crosshair'
    radiusClickHandler = (event) => {
      const center: [number, number] = [event.lngLat.lng, event.lngLat.lat]
      if (!isInsideAquaTerritory(center)) return
      const maximum = Math.min(500, maximumRadius(center))
      if (maximum < 20) { stopRadiusDrawing(); resetState(); return }
      radiusMeters.value = Math.min(radiusMeters.value, maximum)
      const [id] = draw.add(buildRadius(center, radiusMeters.value))
      sync()
      if (id !== undefined) { attachRadiusHandle(center, id, radiusMeters.value); draw.changeMode('simple_select', { featureIds: [String(id)] }) }
      stopRadiusDrawing(); resetState()
    }
    map.once('click', radiusClickHandler)
  }
  const finishPolygon = () => {
    const draw = drawRef.value
    if (!draw || markingMode.value !== 'polygon' || polygonVertexCount.value < 3) return
    const ids = activePolygonId.value === null ? [] : [String(activePolygonId.value)]
    draw.changeMode('simple_select', { featureIds: ids })
    queueMicrotask(() => { if (draw.getMode() !== 'simple_select') draw.changeMode('simple_select', { featureIds: ids }) })
    sync(); resetState()
  }
  const editDrawing = () => {
    const draw = drawRef.value; const feature = draw?.getAll().features[0]
    if (draw && feature?.id !== undefined) draw.changeMode('direct_select', { featureId: String(feature.id) })
  }
  const cancelDrawing = () => {
    const draw = drawRef.value; stopRadiusDrawing()
    if (draw && markingMode.value === 'polygon') { draw.trash(); draw.changeMode('simple_select'); sync() }
    resetState()
  }
  const clearDrawing = () => {
    const draw = drawRef.value
    if (!draw) return
    stopRadiusDrawing(); removeRadiusHandle(); draw.deleteAll(); floodDraft.clearDraft(); resetState()
  }
  const centerOnUserLocation = () => {
    const map = mapRef.value
    if (!map || !navigator.geolocation) return
    isLocating.value = true
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const center: [number, number] = [coords.longitude, coords.latitude]
      if (isInsideAquaTerritory(center)) map.flyTo({ center, zoom: 16, pitch: 0, bearing: 0 })
      isLocating.value = false
    }, () => { isLocating.value = false }, { enableHighAccuracy: true, timeout: 8000 })
  }
  const cleanup = () => {
    const map = mapRef.value
    stopRadiusDrawing(); removeRadiusHandle()
    if (map && drawRef.value) {
      map.off('draw.create', onDrawCreate); map.off('draw.update', sync); map.off('draw.delete', sync)
      if (map.hasControl(drawRef.value)) map.removeControl(drawRef.value)
    }
    drawRef.value = null
  }

  return { isDrawing, markingMode, polygonVertexCount, radiusMeters, isLocating, draftColor,
    setup, cleanup, countPolygonVertex, updateDraftColor, startDrawing, startRadiusDrawing,
    finishPolygon, editDrawing, cancelDrawing, clearDrawing, centerOnUserLocation }
}
