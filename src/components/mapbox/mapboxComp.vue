<script setup lang="ts">
import { onMounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl/dist/mapbox-gl.css'

import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'
import { InfoPoints, LayersFilters, MapboxFilters } from '@/components'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY

const ctrl = useFloodCameraMonitoringStore()

onMounted(() => {
  const map = new mapboxgl.Map({
    container: 'map-fixed',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [-48.8464, -26.3044],
    // center: [geolocation.longitude ?? -48.8464, geolocation.latitude ?? -26.3044],
    zoom: 13,
    pitch: 60,
    bearing: -30,
    antialias: true,
    maxBounds: [
      [-49.0, -26.6],
      [-48.4, -25.9],
    ],
  })

  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl,
    marker: true,
    placeholder: 'Buscar local...',
  })

  map.addControl(geocoder, 'top-left')
  map.addControl(new mapboxgl.NavigationControl(), 'top-left')
})
</script>

<template>
  <div class="relative h-[42vw] min-h-150">
    <div id="map-fixed" class="h-full w-full overflow-hidden rounded-4xl"></div>
    <InfoPoints :points="[]" />
    <MapboxFilters />
    <LayersFilters />
  </div>
</template>
