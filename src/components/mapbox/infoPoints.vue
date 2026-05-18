<script setup lang="ts">
import { TablePoints, CameraPoints } from '@/components'
import { orderedCams } from '@/utils/cameras'
import type { IFloodListItem } from '@/types/flood'

defineProps<{
  points: IFloodListItem[]
}>()
</script>

<template>
  <div
    class="absolute top-15 left-2 h-[38vw] min-h-125 w-2/7 rounded-2xl bg-white p-5 dark:bg-[#001C3B]"
  >
    <TablePoints :points="points" />
    <CameraPoints :cams="orderedCams" />
  </div>
</template>

<!-- <script setup lang="ts">
import { TablePoints, CameraPoints } from '@/components'
import { useCameras } from '@/utils/cameras'
import type { IFloodListItem } from '@/types/flood'

defineProps<{
  points: IFloodListItem[]
}>()

const { orderedCams } = useCameras()
</script>

<template>
  <div
    class="absolute top-15 left-2 h-[38vw] min-h-125 w-2/7 rounded-2xl bg-white p-5 dark:bg-[#001C3B]"
  >
    <TablePoints :points="points" />
    <CameraPoints :cams="orderedCams" />
  </div>
</template> -->
