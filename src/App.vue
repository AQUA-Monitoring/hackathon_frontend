<script setup lang="ts">
import { onMounted } from 'vue'
import { useGeolocationStore } from '@/stores/geolocation'

const geolocation = useGeolocationStore()

onMounted(async () => {
  await geolocation.findNeighborhood()
})
</script>

<template>
  <RouterView />
</template>
