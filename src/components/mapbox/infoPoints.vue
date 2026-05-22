<script setup lang="ts">
import { TablePoints, CameraPoints } from '@/components'
import { useCamerasMonitoring } from '@/composables/useCamerasMonitoring'
import type { IFloodListItem } from '@/types/flood'

defineProps<{
  points: IFloodListItem[]
}>()

const { camerasWithPrediction } = useCamerasMonitoring()
</script>

<template>
  <div
    class="absolute top-15 left-2 h-[38vw] min-h-125 w-2/7 rounded-2xl bg-white p-5 dark:bg-[#001C3B]"
  >
    <TablePoints :points="points" />
    <CameraPoints :cams="camerasWithPrediction" />
  </div>
</template>
