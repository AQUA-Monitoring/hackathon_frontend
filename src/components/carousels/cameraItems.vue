<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { HlsPlayer, EmbedPlayer } from '@/components'
import type { ICamera, ViewMode } from '@/types/camera'

const props = defineProps<{
  cam: ICamera
}>()

const modes = reactive<Record<string, ViewMode>>({})

onMounted(async () => {
  if (props.cam?.id) {
    modes[props.cam.id] = 'hls'
  }
})
</script>

<template>
  <div class="relative">
    <EmbedPlayer
      v-if="modes[cam.id] === 'embed' && cam.embed_url"
      :src="cam.embed_url"
      :title="cam.name"
      class="h-full w-full"
    />
    <HlsPlayer
      v-else
      :src="cam.hls_url"
      :muted="true"
      :controls="true"
      :lock-to-live="true"
      :live-delay="18"
      class="h-full w-full"
    />
  </div>
</template>
