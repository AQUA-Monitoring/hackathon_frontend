<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHlsStream } from '@/composables/useHlsStream'
import type { CameraApiItem } from '@/types/camera'

const props = withDefaults(
  defineProps<{ camera: CameraApiItem; previewsPaused?: boolean; selected?: boolean }>(),
  { previewsPaused: false, selected: false },
)
// A listagem só pode reproduzir a prévia explicitamente autorizada pelo backend;
// nunca reutilizamos video_hls do detalhe como fallback.
const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const documentVisible = ref(typeof document === 'undefined' || !document.hidden)
const itemPaused = ref(false)
const eligible = computed(
  () =>
    props.camera.administrative_status === 'ACTIVE' &&
    Boolean(props.camera.preview_url),
)
const source = computed(() =>
  eligible.value &&
  isVisible.value &&
  documentVisible.value &&
  !props.previewsPaused &&
  !itemPaused.value &&
  !props.selected
    ? (props.camera.preview_url ?? '')
    : '',
)
const loaded = ref(false)
const { videoRef, errorMessage, init } = useHlsStream({
  src: source,
  options: {
    autoplay: true,
    muted: true,
    controls: true,
    playsinline: true,
    lockToLive: true,
    liveDelay: 3,
  },
})
function markLoaded() {
  loaded.value = true
}
function togglePreview() {
  itemPaused.value = !itemPaused.value
}

let observer: IntersectionObserver | null = null
function handleVisibilityChange() {
  documentVisible.value = !document.hidden
}
onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  if (!containerRef.value || typeof IntersectionObserver === 'undefined') {
    isVisible.value = true
    return
  }
  observer = new IntersectionObserver(
    ([entry]) => {
      isVisible.value = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.25)
    },
    { threshold: [0, 0.25, 0.5], rootMargin: '100px 0px' },
  )
  observer.observe(containerRef.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
watch(source, () => {
  loaded.value = false
})
</script>
<template>
  <div
    ref="containerRef"
    class="group relative aspect-video overflow-hidden rounded-2xl bg-[#00182F]"
  >
    <video
      ref="videoRef"
      class="h-full w-full object-cover"
      controls
      muted
      playsinline
      @loadeddata="markLoaded"
      @canplay="markLoaded"
    />
    <div
      v-if="!eligible"
      class="absolute inset-0 grid place-items-center p-4 text-center text-sm text-slate-300"
    >
      Transmissão indisponível
    </div>
    <div
      v-else-if="selected"
      class="absolute inset-0 grid place-items-center p-4 text-center text-sm text-slate-300"
    >
      Em exibição no player principal
    </div>
    <div
      v-else-if="previewsPaused || itemPaused"
      class="absolute inset-0 grid place-items-center p-4 text-center text-sm text-slate-300"
    >
      Prévia pausada
    </div>
    <div
      v-else-if="!loaded && !errorMessage"
      class="absolute inset-0 grid place-items-center bg-[#00182F]/55 text-white"
      aria-live="polite"
    >
      <span class="material-symbols-outlined animate-spin text-3xl" aria-hidden="true"
        >progress_activity</span
      ><span class="sr-only">Carregando transmissão</span>
    </div>
    <div
      v-if="errorMessage"
      class="absolute right-2 bottom-2 left-2 flex items-center justify-between gap-2 rounded-lg bg-red-600/90 px-3 py-2 text-xs font-semibold text-white"
    >
      <span>Transmissão indisponível</span>
      <button type="button" class="min-h-8 rounded-md bg-white/15 px-2 underline" @click="init">
        Tentar novamente
      </button>
    </div>
    <button
      v-if="eligible && !selected"
      type="button"
      class="absolute top-2 right-2 grid size-10 place-items-center rounded-full bg-[#00182F]/80 text-white opacity-100 shadow transition focus-visible:outline-3 focus-visible:outline-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      :aria-label="itemPaused ? 'Retomar prévia' : 'Pausar prévia'"
      :aria-pressed="itemPaused"
      @click="togglePreview"
    >
      <span class="material-symbols-outlined" aria-hidden="true">{{
        itemPaused ? 'play_arrow' : 'pause'
      }}</span>
    </button>
  </div>
</template>
