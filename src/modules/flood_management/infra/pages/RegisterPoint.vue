<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { useNeighborhood } from '@/@core/composables/neighborhood'
import { useFloodController } from '../../controllers/FloodController'
import { TextField } from '@/@core/components'
import moment from 'moment'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY
const { loadNeighborhoods, getLocalization } = useNeighborhood()
const { registerFloodPoint } = useFloodController()
const router = useRouter()
const neighborhood = ref<string | null>(null)
const drawnCoordinates = ref<any[]>([])
const formValues = ref<Record<string, any>>({
    city: '',
    neighborhood: '',
    possibility: '',
    duration: '',
})

// Function to calculate polygon centroid
function calculatePolygonCentroid(coordinates: number[][]): [number, number] {
    let x = 0,
        y = 0
    const n = coordinates.length

    for (const coord of coordinates) {
        x += coord[0] // longitude
        y += coord[1] // latitude
    }

    return [x / n, y / n]
}

onMounted(async () => {
    await loadNeighborhoods()

    // Load coordinates from window.currentDrawn if available
    if (window.currentDrawn && window.currentDrawn.length > 0) {
        drawnCoordinates.value = window.currentDrawn

        // Calculate centroid and set city/neighborhood after neighborhoods are loaded
        if (
            drawnCoordinates.value[0] &&
            drawnCoordinates.value[0].geometry &&
            drawnCoordinates.value[0].geometry.coordinates
        ) {
            const coordinates = drawnCoordinates.value[0].geometry.coordinates[0]
            const [lng, lat] = calculatePolygonCentroid(coordinates)

            // Set form values automatically
            const localization = getLocalization(lng, lat)
            formValues.value.city = localization.city
            formValues.value.neighborhood = localization.neighborhood
            formValues.value.props = drawnCoordinates.value
        }
    }

    const map = new mapboxgl.Map({
        container: 'map-register_point',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-48.8464, -26.3044],
        zoom: 13,
        pitch: 60,
        bearing: -30,
        antialias: true,
    })

    map.on('load', async () => {
        try {
            // Load and display drawn coordinates from FloodMap
            if (drawnCoordinates.value.length > 0) {
                // Add source for drawn polygons
                map.addSource('drawn-polygons', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: drawnCoordinates.value,
                    },
                })

                // Add layer to display drawn polygons
                map.addLayer({
                    id: 'drawn-polygons-fill',
                    type: 'fill',
                    source: 'drawn-polygons',
                    paint: {
                        'fill-color': '#ff0000',
                        'fill-opacity': 0.3,
                    },
                })

                map.addLayer({
                    id: 'drawn-polygons-outline',
                    type: 'line',
                    source: 'drawn-polygons',
                    paint: {
                        'line-color': '#ff0000',
                        'line-width': 2,
                    },
                })

                // Fit map to show drawn polygons
                if (drawnCoordinates.value[0] && drawnCoordinates.value[0].geometry) {
                    const coordinates = drawnCoordinates.value[0].geometry.coordinates[0]
                    const bounds = new mapboxgl.LngLatBounds()
                    coordinates.forEach((coord: [number, number]) => bounds.extend(coord))
                    map.fitBounds(bounds, { padding: 50 })
                }
            }
        } catch (error) {
            console.error('Erro ao carregar floodGeojson:', error)
        }
    })

    map.on('click', (e) => {
        const { lng, lat } = e.lngLat
        neighborhood.value = getLocalization(lng, lat)
    })
})

async function handleRegisterPoint(values: Record<string, any>) {
    try {
        // Merge form values with any auto-detected values
        const finished_at = moment().add(formValues.value.duration, 'minutes').toISOString()
        const finalValues = {
            ...formValues.value,
            ...values,
            props: drawnCoordinates.value,
            finished_at,
        }

        // Send the data to the backend with coordinates
        const result = await registerFloodPoint(finalValues)
        router.push('/')
    } catch (error) {
        console.error('Error registering flood point:', error)
        // You can add error handling UI here
    }
}
</script>

<template>
    <div class="grid justify-center px-5 pt-5 pb-20">
        <h1 class="mb-10 hidden text-center text-2xl font-semibold lg:block">Registrar ponto</h1>
        <div class="h-[350px] overflow-hidden rounded-2xl lg:w-[50vw]">
            <div id="map-register_point" class="h-full w-full"></div>
        </div>
        <div class="m-5 flex flex-col gap-y-2">
            <TextField :field="{ label: 'City', type: 'text' }" v-model="formValues.city" />
            <TextField
                :field="{ label: 'Bairro', type: 'text' }"
                v-model="formValues.neighborhood"
            />
            <div class="flex gap-3">
                <TextField
                    class="grow"
                    :field="{ label: 'Probabilidade', type: 'number' }"
                    v-model="formValues.possibility"
                />
                <TextField
                    class="grow"
                    :field="{ label: 'Duração em minutos', type: 'number' }"
                    v-model="formValues.duration"
                />
            </div>
            <button
                class="mx-auto mt-5 w-[250px] rounded-2xl bg-blue-500 p-2 font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600"
                type="submit"
                @click="handleRegisterPoint(formValues)"
            >
                Cadastrar
            </button>
        </div>
    </div>
</template>
