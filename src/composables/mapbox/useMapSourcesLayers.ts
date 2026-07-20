import type { FeatureCollection, Point } from 'geojson'
import type mapboxgl from 'mapbox-gl'
import type { FloodPointFeatureCollection } from '@/types/floodPoints'

export const FLOOD_FILL_LAYER_ID = 'flood-points-fill'
export const ML_LAYER_ID = 'ml-predictions-layer'
const FLOOD_SOURCE_ID = 'flood-points-source'
const FLOOD_OUTLINE_LAYER_ID = 'flood-points-outline'
const ML_SOURCE_ID = 'ml-predictions-source'

export const useMapSourcesLayers = () => {
  const syncFlood = (map: mapboxgl.Map, data: FloodPointFeatureCollection) => {
    const source = map.getSource(FLOOD_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
    if (source) {
      source.setData(data)
      return
    }
    map.addSource(FLOOD_SOURCE_ID, { type: 'geojson', data })
    map.addLayer({
      id: FLOOD_FILL_LAYER_ID,
      type: 'fill',
      source: FLOOD_SOURCE_ID,
      paint: {
        'fill-color': ['step', ['get', 'probability'], '#87FD8B', 41, '#FFE101', 71, '#FF4D4D'],
        'fill-opacity': 0.4,
      },
    })
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

  const syncMachineLearning = (map: mapboxgl.Map, data: FeatureCollection<Point>) => {
    const source = map.getSource(ML_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
    if (source) {
      source.setData(data)
      return
    }
    map.addSource(ML_SOURCE_ID, { type: 'geojson', data })
    map.addLayer({
      id: ML_LAYER_ID,
      type: 'heatmap',
      source: ML_SOURCE_ID,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'probability'], 0, 0, 100, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 16, 3],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(33,102,172,0)',
          0.2, 'rgba(103,169,207,0.6)', 0.4, 'rgba(255,225,1,0.7)',
          0.6, 'rgba(255,140,0,0.8)', 0.8, 'rgba(255,77,77,0.9)', 1, 'rgb(178,24,43)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 16, 40],
        'heatmap-opacity': 0.8,
      },
    })
  }

  return { syncFlood, syncMachineLearning }
}
