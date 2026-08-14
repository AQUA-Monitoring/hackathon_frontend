<script setup lang="ts">
import { HlsPlayer } from '.'
import type { CameraSummary } from '../types/camera'

defineProps<{
  cam: CameraSummary
}>()
</script>

<template>
  <div class="relative">
    <HlsPlayer
      v-if="cam.previewUrl"
      :src="cam.previewUrl"
      :muted="true"
      :controls="true"
      :lock-to-live="true"
      :live-delay="18"
      class="h-full w-full"
    />
    <div v-else class="grid min-h-32 place-items-center bg-[#00182F] px-4 text-center text-sm text-white">
      Prévia indisponível
    </div>
  </div>
</template>
