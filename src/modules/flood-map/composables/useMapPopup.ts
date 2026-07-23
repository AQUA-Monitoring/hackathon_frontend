import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import type mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import { cameraCoordinates, type CameraApiItem } from '@/modules/cameras'
import type { FloodPointFeatureCollection, FloodPointUiItem } from '@/modules/flood-points'
import type { ResolvedLocalization } from '@/modules/addressing'
import { FLOOD_FILL_LAYER_ID, ML_LAYER_ID } from './useMapSourcesLayers'

export type MapContextState =
  | { kind: 'closed' }
  | { kind: 'camera'; camera: CameraApiItem }
  | { kind: 'flood'; flood: FloodPointUiItem; cameras: CameraApiItem[] }
  | {
      kind: 'territory'
      territory: ResolvedLocalization
      cameras: CameraApiItem[]
      points: FloodPointUiItem[]
    }

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null)
const normalize = (value: string | null | undefined) =>
  value?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLocaleLowerCase('pt-BR') ?? ''

function cameraMatchesTerritory(camera: CameraApiItem, territory: ResolvedLocalization) {
  const address = camera.address
  const neighborhood = address?.neighborhood ?? camera.neighborhood
  const region = address?.region ?? camera.region
  if (territory.neighborhoodId && neighborhood?.id) {
    return neighborhood.id === territory.neighborhoodId
  }
  if (territory.regionId && region?.id) return region.id === territory.regionId
  return (
    normalize(neighborhood?.name) === normalize(territory.neighborhood) &&
    normalize(address?.city_ref?.name ?? address?.city) === normalize(territory.city)
  )
}

function pointMatchesTerritory(point: FloodPointUiItem, territory: ResolvedLocalization) {
  return point.neighborhoods.some((neighborhood) => {
    if (territory.neighborhoodId && neighborhood.id) {
      return neighborhood.id === territory.neighborhoodId
    }
    if (territory.regionId && neighborhood.region?.id) {
      return neighborhood.region.id === territory.regionId
    }
    return (
      normalize(neighborhood.name) === normalize(territory.neighborhood) &&
      normalize(point.city) === normalize(territory.city)
    )
  })
}

function camerasForFlood(
  cameras: CameraApiItem[],
  floodId: string,
  activeGeoJson: FloodPointFeatureCollection,
) {
  const geometries = activeGeoJson.features.filter(
    (feature) => feature.properties.floodId === floodId,
  )
  return cameras.filter((camera) => {
    if (camera.administrative_status !== 'ACTIVE' || camera.status === 'INACTIVE') return false
    const coordinates = cameraCoordinates(camera)
    if (!coordinates) return false
    const point = turf.point(coordinates)
    return geometries.some((feature) => turf.booleanPointInPolygon(point, feature))
  })
}

export const useMapPopup = (options: {
  getLocalization: (lng: number, lat: number) => ResolvedLocalization | null | undefined
  cameras: MaybeRefOrGetter<CameraApiItem[]>
  activePoints: MaybeRefOrGetter<FloodPointUiItem[]>
  activeGeoJson: MaybeRefOrGetter<FloodPointFeatureCollection>
  selectFlood: (id: string) => void
  clearSelectedFlood: () => void
}) => {
  const context = ref<MapContextState>({ kind: 'closed' })

  function close() {
    options.clearSelectedFlood()
    context.value = { kind: 'closed' }
  }

  function openCamera(camera: CameraApiItem) {
    options.clearSelectedFlood()
    context.value = { kind: 'camera', camera }
  }

  const handleClick = (map: mapboxgl.Map, event: mapboxgl.MapMouseEvent) => {
    const floodFeature = map.getLayer(FLOOD_FILL_LAYER_ID)
      ? map.queryRenderedFeatures(event.point, { layers: [FLOOD_FILL_LAYER_ID] })[0]
      : undefined
    if (floodFeature) {
      const floodId = text(floodFeature.properties?.floodId)
      const flood = toValue(options.activePoints).find((item) => item.id === floodId)
      if (flood) {
        options.selectFlood(flood.id)
        context.value = {
          kind: 'flood',
          flood,
          cameras: camerasForFlood(
            toValue(options.cameras),
            flood.id,
            toValue(options.activeGeoJson),
          ),
        }
        return
      }
    }

    const ml = map.getLayer(ML_LAYER_ID)
      ? map.queryRenderedFeatures(event.point, { layers: [ML_LAYER_ID] })[0]
      : undefined
    if (ml) {
      close()
      return
    }

    options.clearSelectedFlood()
    const territory = options.getLocalization(event.lngLat.lng, event.lngLat.lat)
    if (!territory) {
      context.value = { kind: 'closed' }
      return
    }
    const activeCameras = toValue(options.cameras).filter(
      (camera) =>
        camera.administrative_status === 'ACTIVE' &&
        camera.status !== 'INACTIVE' &&
        cameraMatchesTerritory(camera, territory),
    )
    const points = toValue(options.activePoints).filter((point) =>
      pointMatchesTerritory(point, territory),
    )
    context.value =
      activeCameras.length || points.length
        ? { kind: 'territory', territory, cameras: activeCameras, points }
        : { kind: 'closed' }
  }

  return { context, close, openCamera, handleClick }
}
