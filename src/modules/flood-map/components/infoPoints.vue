<script setup lang="ts">
import CameraPoints from './cameraPoints.vue'
import TablePoints from './tablePoints.vue'
import { useCamerasMonitoring } from '@/modules/cameras'
import { useFloodPointsMap } from '@/composables/useFloodPointsMap'

const { camerasWithPrediction } = useCamerasMonitoring()
const { tablePoints } = useFloodPointsMap()
</script>

<template>
  <div
    class="absolute top-15 left-2 h-[38vw] min-h-125 w-2/7 rounded-2xl bg-white p-5 dark:bg-[#001C3B]"
  >
    <TablePoints :points="tablePoints" />
    <CameraPoints :cams="camerasWithPrediction" />
  </div>
</template>
