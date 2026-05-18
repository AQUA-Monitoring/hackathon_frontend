<script setup lang="ts">
import { CamerasGrid } from '@/components'
import { useCamerasMonitoring } from '@/composables/useCamerasMonitoring'

const { camerasWithPrediction } = useCamerasMonitoring()
</script>

<template>
  <section>
    <CamerasGrid :cameras="camerasWithPrediction" />
  </section>
</template>
