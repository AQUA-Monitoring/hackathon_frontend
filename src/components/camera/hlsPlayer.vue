<script setup lang="ts">
import { useHlsStream } from '@/composables/useHlsStream'

const props = withDefaults(
  defineProps<{
    src: string
    autoplay?: boolean
    muted?: boolean
    controls?: boolean
    playsinline?: boolean
    poster?: string
    lockToLive?: boolean
    liveDelay?: number
    maxDelaySec?: number
  }>(),
  {
    autoplay: true,
    muted: true,
    controls: true,
    playsinline: true,
    lockToLive: false,
    liveDelay: 15,
    maxDelaySec: 60,
  },
)

const { errorMessage } = useHlsStream({ src: props.src, options: props })
</script>

<template>
  <div class="relative h-full w-full">
    <video
      ref="videoRef"
      :autoplay="autoplay"
      :muted="muted"
      :controls="controls"
      :playsinline="playsinline"
      :poster="poster"
      class="h-full w-full"
      controlsList="noplaybackrate nodownload"
      style="object-fit: cover; background: #000"
    />

    <div v-if="errorMessage" class="absolute right-2 bottom-2 left-2">
      <div class="rounded-md bg-red-600/80 px-3 py-2 text-xs font-semibold text-white shadow">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>
