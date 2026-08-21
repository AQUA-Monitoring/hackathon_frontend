<script setup lang="ts">
import { onMounted } from 'vue'
import { CameraCard } from '../components'
import { useCamerasMonitoring } from '../composables/useCamerasMonitoring'
const { cameras, lastSuccessfulAt } = useCamerasMonitoring()

onMounted(() => {
  console.log('Cameras:', cameras)
  console.log('Last successful fetch at:', lastSuccessfulAt.value)
})
</script>

<template>
  <section class="px-10">
    <div class="flex w-full items-center justify-between py-5">
      <h1 class="grid gap-2 text-4xl font-semibold lg:gap-5 lg:text-5xl">
        <span>Visão geral das</span>
        <span>câmeras</span>
      </h1>

      <img src="/gifs/camera.gif" alt="Animação" class="mr-20 hidden h-70 w-70 lg:block" />
    </div>
    <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      <CameraCard v-for="cam in cameras" :key="cam.id" :cam="cam" />
    </div>
  </section>
</template>
