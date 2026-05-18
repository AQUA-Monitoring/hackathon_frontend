<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useHlsStream } from '@/composables/useHlsStream'
import type { HlsOptions } from '@/types/camera'

type HlsPlayerProps = HlsOptions & {
  src: string
}

const props = withDefaults(defineProps<HlsPlayerProps>(), {
  autoplay: true,
  muted: true,
  controls: true,
  playsinline: true,
  lockToLive: false,
  liveDelay: 15,
  maxDelaySec: 60,
})

const options = computed<HlsOptions>(() => ({
  autoplay: props.autoplay,
  muted: props.muted,
  controls: props.controls,
  playsinline: props.playsinline,
  poster: props.poster,
  lockToLive: props.lockToLive,
  liveDelay: props.liveDelay,
  maxDelaySec: props.maxDelaySec,
}))

const { errorMessage, videoRef } = useHlsStream({
  src: toRef(props, 'src'),
  options,
})
</script>

<template>
  <div class="relative h-full w-full">
    <video ref="videoRef" :autoplay="autoplay" :muted="muted" :controls="controls" :playsinline="playsinline"
      :poster="poster" class="h-full w-full" controlsList="noplaybackrate nodownload"
      style="object-fit: cover; background: #000" />

    <div v-if="errorMessage" class="absolute right-2 bottom-2 left-2">
      <div class="rounded-md bg-red-600/80 px-3 py-2 text-xs font-semibold text-white shadow">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>
