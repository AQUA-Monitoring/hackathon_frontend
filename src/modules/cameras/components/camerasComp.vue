<template>
  <PriorityCameraGrid
    :cameras="props.cameras"
    :loading="props.loading"
    :error="props.error"
  />
</template>

<script setup lang="ts">
import PriorityCameraGrid from './PriorityCameraGrid.vue'
import type { CameraApiItem } from '../types/camera'

const props = defineProps<{
  cameras?: CameraApiItem[]
  loading?: boolean
  error?: string | null
}>()
</script>
