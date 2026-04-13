<script setup lang="ts">
import { ref, onMounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import DataMapboxPopup from './dataMapboxPopup.vue'
import { useNeighborhood } from '@/@core/composables/neighborhood'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY

const { loadNeighborhoods, getLocalization } = useNeighborhood()
const neighborhood = ref<string | null>(null)
const city = ref<string | null>(null)
const showPopup = ref(false)
const togglePopup = () => (showPopup.value = !showPopup.value)
const emit = defineEmits(['close'])

onMounted(async () => {
    await loadNeighborhoods()

    const map = new mapboxgl.Map({
        container: 'map-popup',
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

    map.on('load', async () => {})

    map.on('click', (e) => {
        togglePopup()
        const { lng, lat } = e.lngLat
        const localization = getLocalization(lng, lat)
        neighborhood.value = localization.neighborhood
        city.value = localization.city
    })
})

const handleOverlayClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).id === 'overlay') {
        emit('close')
    }
}
</script>

<template>
    <div
        id="overlay"
        class="fixed inset-0 z-20 flex items-center justify-center bg-black/80"
        @click="handleOverlayClick"
    >
        <div
            class="flex max-h-[90vh] w-[90%] flex-col overflow-y-auto rounded-2xl bg-white p-4 shadow-lg dark:bg-[#000d19]"
        >
            <div class="relative h-[70vh] overflow-hidden rounded-2xl">
                <button
                    class="absolute top-2 left-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-500 pl-2 text-white transition-colors duration-300 hover:bg-blue-600 dark:bg-[#000D19]"
                    @click="emit('close')"
                >
                    <span class="material-symbols-outlined">arrow_back_ios</span>
                </button>
                <div id="map-popup" class="h-full w-full"></div>
                <DataMapboxPopup :neighborhood="neighborhood" :city="city" v-if="showPopup" />
            </div>
        </div>
    </div>
</template>
