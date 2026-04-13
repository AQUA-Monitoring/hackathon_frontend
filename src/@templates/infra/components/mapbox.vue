<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { useFloodCameraMonitoringController } from '@/modules/flood_camera_monitoring/controller/FloodCameraMonitoringController'
import { useGeolocationStore } from '@/@core/plugins/registered/pinia/geolocation'
import { MapboxFilters, InfoPoints } from '../components'
import { useFloodMapIA } from '@/@core/composables/useFloodMap'
import { useFloodController } from '@/modules/flood_management/controllers/FloodController'
import type { IFlood } from '@/@core/interfaces/flood'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY

const router = useRouter()
const ctrl = useFloodCameraMonitoringController()
const geolocation = useGeolocationStore()
const { getFloods, state } = useFloodController()

const { points, init, toGeoJSON } = useFloodMapIA()

onMounted(async () => {
    const map = new mapboxgl.Map({
        container: 'map-fixed',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [geolocation.longitude ?? -48.8464, geolocation.latitude ?? -26.3044],
        zoom: 13,
        pitch: 60,
        bearing: -30,
        antialias: true,
        maxBounds: [
            [-49.0, -26.6],
            [-48.4, -25.9],
        ],
    })

    // Carrega os pontos de alagamento e loga os retornos
    const resp = await getFloods()

    // Log também quando a lista for atualizada
    watch(
        () => state.floods.length,
        () => {},
        { immediate: true },
    )

    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl,
        marker: true,
        placeholder: 'Buscar local...',
    })
    map.addControl(geocoder, 'top-right')

    geolocation.getCurrentPosition().then((position) => {
        new mapboxgl.Marker().setLngLat([position.longitude, position.latitude]).addTo(map)
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    if (window.matchMedia('(max-width: 1023px)').matches) {
        map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right')
    }

    function addCustomMarker(lng: number, lat: number, cameraId: string) {
        const el = document.createElement('div')
        el.className = 'custom-marker'
        el.style.backgroundImage = 'url("/weather_information/camera.svg")'
        el.style.width = '80px'
        el.style.height = '80px'
        el.style.backgroundSize = 'contain'
        el.style.backgroundRepeat = 'no-repeat'
        el.style.cursor = 'pointer'

        el.addEventListener('click', () => {
            router.push(`/cameras/${cameraId}`)
        })

        new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map)
    }

    map.on('load', async () => {
        map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb',
            tileSize: 512,
            maxzoom: 14,
        })

        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })
        // Hillshade para sombra do relevo
        map.addLayer({
            id: 'hillshade-layer',
            type: 'hillshade',
            source: 'mapbox-dem',
            layout: { visibility: 'visible' },
            paint: {
                'hillshade-exaggeration': 0.5,
            },
        })
        // Prédios 3D
        map.addLayer(
            {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                    'fill-extrusion-color': '#aaa',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.6,
                },
            },
            'waterway-label',
        )

        await ctrl.load()
        await init()

        // Reaproveita os dados já carregados no estado
        state.floods.forEach((fp: IFlood) => {
            if (fp.props) {
                const sourceId = `flood-point-${fp.id}`
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: fp.props,
                    },
                })

                map.addLayer({
                    id: sourceId + '-fill',
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-color': '#ff0000',
                        'fill-opacity': 0.3,
                    },
                })

                map.addLayer({
                    id: sourceId + '-outline',
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': '#ff0000',
                        'line-width': 2,
                    },
                })
            }
        })

        try {
            watch(
                points,
                (newPoints) => {
                    const geojson = toGeoJSON()
                    if (!map.getSource('flood-points')) {
                        map.addSource('flood-points', {
                            type: 'geojson',
                            data: geojson,
                        })
                        map.addLayer({
                            id: 'flood-points-layer',
                            type: 'heatmap',
                            source: 'flood-points',
                            paint: {
                                'heatmap-weight': [
                                    'interpolate',
                                    ['linear'],
                                    ['get', 'intensity'],
                                    0,
                                    0,
                                    1,
                                    1,
                                ],
                                'heatmap-color': [
                                    'interpolate',
                                    ['linear'],
                                    ['heatmap-density'],
                                    0,
                                    'rgba(0, 0, 255, 0)',
                                    0.1,
                                    '#10439F',
                                    //0.3, "#3981BF",
                                    0.5,
                                    '#0453AF',
                                    //0.7, "#469AA0",
                                    0.9,
                                    '#6DBFC5',
                                    1,
                                    'red',
                                ],
                                'heatmap-radius': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    10,
                                    30,
                                    15,
                                    65,
                                ],
                                'heatmap-opacity': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    10,
                                    0.9,
                                    15,
                                    0.75,
                                ],
                            },
                        })
                    } else {
                        const source = map.getSource('flood-points') as mapboxgl.GeoJSONSource
                        source.setData(geojson)
                    }
                },
                { immediate: true },
            )
        } catch (error) {
            console.error('Erro ao carregar floodGeojson:', error)
        }

        ctrl.cameras.forEach((camera) => {
            if (camera.latitude && camera.longitude) {
                addCustomMarker(camera.longitude, camera.latitude, camera.id)
            } else {
                console.warn('Câmera sem coordenadas:', camera)
            }
        })
    })
})
</script>

<template>
    <section class="mb-10">
        <div class="relative h-[40vw] min-h-[500px] overflow-hidden rounded-2xl">
            <div id="map-fixed" class="h-full w-full"></div>
            <MapboxFilters class="hidden lg:block" />
        </div>

        <MapboxFilters class="lg:hidden" />
        <InfoPoints :points="state.floods" />
    </section>
</template>
