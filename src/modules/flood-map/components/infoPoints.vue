<script setup lang="ts">
import TablePoints from './tablePoints.vue'
import { useFloodPointsMap } from '@/modules/flood-points'

const { tablePoints } = useFloodPointsMap()
</script>

<template>
  <div
    class="absolute top-15 left-2 h-[38vw] min-h-125 w-2/7 rounded-2xl bg-white p-5 dark:bg-[#001C3B]"
  >
    <TablePoints :points="tablePoints" />
  </div>
</template>
