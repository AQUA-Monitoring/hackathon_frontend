<script setup lang="ts">
import { computed } from 'vue'
import type { CameraApiItem } from '@/types/camera'
import { cameraPresentation, cameraToneClasses } from '@/utils/cameraPresentation'

const props = defineProps<{ camera: CameraApiItem }>()
const presentation = computed(() => cameraPresentation(props.camera))
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
    :class="cameraToneClasses(presentation.tone)"
  >
    <span class="size-2 rounded-full bg-current" aria-hidden="true"></span>
    {{ presentation.label }}
  </span>
</template>
