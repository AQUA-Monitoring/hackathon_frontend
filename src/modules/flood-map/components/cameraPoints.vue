<script setup lang="ts">
import { HomeCameraCarousel } from '@/modules/cameras'
import type { CameraApiItem } from '@/modules/cameras'

defineProps<{
  cameras: CameraApiItem[]
  selectedCameraId: string | null
  loading?: boolean
  error?: string | null
}>()
defineEmits<{ 'update:selectedCameraId': [id: string] }>()
</script>

<template>
  <HomeCameraCarousel
    :cameras="cameras"
    :selected-camera-id="selectedCameraId"
    :loading="loading"
    :error="error"
    @update:selected-camera-id="$emit('update:selectedCameraId', $event)"
  />
</template>
