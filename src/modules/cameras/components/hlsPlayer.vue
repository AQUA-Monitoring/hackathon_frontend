<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useHlsStream } from '@/shared'
import type { HlsOptions } from '@/shared'

type HlsPlayerProps = HlsOptions & {
  src: string
  errorLabel?: string
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

const emit = defineEmits<{
  segmentChange: [sequence: number | null]
  latencyChange: [seconds: number | null]
}>()

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

const { errorMessage, autoplayBlocked, requestPlay, videoRef, init } = useHlsStream({
  src: toRef(props, 'src'),
  options,
  onSegmentChange: (sequence) => emit('segmentChange', sequence),
  onLatencyChange: (seconds) => emit('latencyChange', seconds),
})

defineExpose({ restart: init })
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
        {{ errorLabel || errorMessage }}
      </div>
    </div>
    <div v-else-if="autoplayBlocked" class="absolute inset-0 grid place-items-center bg-black/50 p-4">
      <button
        type="button"
        class="min-h-11 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0750AF] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
        @click="requestPlay"
      >
        Reproduzir transmissão
      </button>
    </div>
  </div>
</template>
