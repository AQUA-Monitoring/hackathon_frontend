<script setup lang="ts">
import { onMounted } from 'vue'
import { HomeBanner, HomeMapbox, HomeBlog } from '../components'
import { useGeolocationStore } from '@/@core/plugins/registered/pinia/geolocation'
import { useLocationStore } from '@/@core/plugins/registered/pinia/location'

const geolocation = useGeolocationStore()
const locationStore = useLocationStore()

onMounted(async () => {
    const currentLocation = await geolocation.findNeighborhood()
    locationStore.$patch({
        neighborhood: currentLocation?.neighborhood || 'Desconhecido',
        city: currentLocation?.city || 'Desconhecida',
    })
})
</script>

<template>
    <div>
        <HomeBanner />
        <HomeMapbox :location="locationStore" />
        <HomeBlog />
    </div>
</template>
