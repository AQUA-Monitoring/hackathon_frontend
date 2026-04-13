<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

import { useNeighborhood } from '@/@core/composables/neighborhood'
import { useNavigation } from '@/@core/composables/navigation'
import { useFloodMapIA } from '@/@core/composables/useFloodMap'
import { useFloodController } from '../../controllers/FloodController'
import Table from '../components/table.vue'

// Using local loose typing to avoid module resolution issues during build
type IFlood = any

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY

const neighborhood = ref<{ city: string; neighborhood: string } | null>(null)
const isOpen = ref(false)
const floodPoints = ref<IFlood[]>([])

const { loadNeighborhoods, getLocalization } = useNeighborhood()
const { routerBack } = useNavigation()
const { getFloods, state } = useFloodController()
const { points, init, toGeoJSON } = useFloodMapIA()

const toggleSheet = () => {
    isOpen.value = !isOpen.value
}

onMounted(async () => {
    await loadNeighborhoods()
    await getFloods()
    floodPoints.value = state.floods

    const map = new mapboxgl.Map({
        container: 'map-admin',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-48.8464, -26.3044],
        zoom: 13,
        pitch: 60,
        bearing: -30,
        antialias: true,
    })

    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl,
        marker: true,
        placeholder: 'Buscar local...',
    })
    map.addControl(geocoder, 'top-right')

    const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            trash: true,
        },
        defaultMode: 'draw_polygon',
    })
    map.addControl(draw, 'top-right')

    map.on('draw.create', () => {
        const data = draw.getAll()
        window.currentDrawn = data.features
    })

    map.on('draw.update', () => {
        const data = draw.getAll()
        window.currentDrawn = data.features
    })

    map.on('draw.delete', () => {
        const data = draw.getAll()
        window.currentDrawn = data.features
    })

    map.on('load', async () => {
        await init()
        try {
            floodPoints.value.forEach((fp: IFlood) => {
                if (fp.props) {
                    const sourceId = `flood-point-${fp.id}`

                    // Adiciona a propriedade probability em cada feature
                    const featuresWithProbability = fp.props.map((feature: any) => ({
                        ...feature,
                        properties: {
                            ...feature.properties,
                            probability: fp.probability, // 0 a 100
                            floodId: fp.id,
                            neighborhood: fp.neighborhood,
                            createdAt: fp.createdAt,
                            duration: fp.duration,
                        },
                    }))

                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: featuresWithProbability,
                        },
                    })

                    // Área do ponto
                    map.addLayer({
                        id: sourceId + '-fill',
                        type: 'fill-extrusion',
                        source: sourceId,
                        paint: {
                            'fill-extrusion-color': [
                                'interpolate',
                                ['linear'],
                                ['get', 'probability'],
                                0,
                                '#6DBFC5',
                                20,
                                '#6DBFC5',
                                21,
                                '#469AA0',
                                40,
                                '#469AA0',
                                41,
                                '#2A7D93',
                                60,
                                '#2A7D93',
                                61,
                                '#3981BF',
                                80,
                                '#3981BF',
                                81,
                                '#10439F',
                                100,
                                '#10439F',
                            ],
                            'fill-extrusion-height': 10,
                            'fill-extrusion-base': 0,
                            'fill-extrusion-opacity': 0.5,
                        },
                    })
                    // Popup com props ao clicar na área
                    map.on('click', sourceId + '-fill', (e) => {
                        const f = e.features?.[0]
                        const p: any = f?.properties || {}
                        const html = `
                            <div style="font-size:12px">
                                <div><strong>Bairro:</strong> ${p.neighborhood ?? '-'}</div>
                                <div><strong>Probabilidade:</strong> ${p.probability ?? '-'}%</div>
                                <div><strong>Duração:</strong> ${p.duration ?? '-'} min</div>
                                <div><strong>Criado em:</strong> ${p.createdAt ?? '-'}</div>
                                <div><strong>ID:</strong> ${p.floodId ?? '-'}</div>
                            </div>
                        `
                        new mapboxgl.Popup()
                            .setLngLat((e as any).lngLat)
                            .setHTML(html)
                            .addTo(map)
                    })

                    // Contorno do ponto
                    map.addLayer({
                        id: sourceId + '-outline',
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': [
                                'interpolate',
                                ['linear'],
                                ['get', 'probability'],
                                0,
                                '#6DBFC5',
                                0.2,
                                '#6DBFC5',
                                0.21,
                                '#469AA0',
                                0.4,
                                '#469AA0',
                                0.41,
                                '#2A7D93',
                                0.6,
                                '#2A7D93',
                                0.61,
                                '#3981BF',
                                0.8,
                                '#3981BF',
                                0.81,
                                '#10439F',
                                1,
                                '#10439F',
                            ],
                            'line-width': 1,
                        },
                    })
                }
            })

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
    })

    map.on('click', (e) => {
        const { lng, lat } = e.lngLat
        const loc = getLocalization(lng, lat)
        neighborhood.value = loc
    })
})
</script>

<template>
    <div class="lg:flex-cols-2 relative h-screen w-screen overflow-hidden lg:flex">
        <div class="absolute top-5 left-0 z-10 flex items-center gap-2 px-4">
            <button
                class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 pl-2 text-white transition-colors duration-300 hover:bg-blue-600 dark:bg-[#000D19]"
                @click="routerBack"
            >
                <span class="material-symbols-outlined">arrow_back_ios</span>
            </button>
        </div>

        <div id="map-admin" class="h-screen flex-1"></div>

        <div
            class="absolute bottom-0 left-0 z-10 w-full rounded-t-2xl bg-white p-4 shadow-lg transition-transform duration-300 lg:relative lg:w-[380px] dark:bg-[#00182F]"
            :class="
                isOpen
                    ? 'translate-y-5 lg:translate-x-0'
                    : 'translate-y-[70%] lg:translate-x-0 lg:translate-y-0'
            "
        >
            <div
                class="lg:absolute lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:h-full lg:rounded-none lg:p-4"
            >
                <div class="grid gap-3" @click="toggleSheet">
                    <div class="mx-auto h-1.5 w-12 rounded-full bg-gray-400 lg:hidden"></div>

                    <RouterLink
                        to="/admin/registrar-ponto"
                        class="mx-auto rounded-xl bg-blue-500 px-6 py-2 font-semibold text-white transition-colors duration-300 hover:bg-blue-600 dark:bg-[#000D19]"
                    >
                        Inserir novo ponto
                    </RouterLink>

                    <h3 class="mx-auto mt-5 mb-3 font-semibold">Pontos atuais</h3>
                    <Table :points="floodPoints" />
                </div>
            </div>
        </div>
    </div>
</template>
