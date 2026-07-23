<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  CameraStatusBadge,
  FloodCameraMonitoringApi,
  HlsPlayer,
  cameraAddressLabel,
  cameraPresentation,
} from '@/modules/cameras'
import type { CameraApiItem } from '@/modules/cameras'
import type { MapContextState } from '../composables/useMapPopup'

const props = withDefaults(
  defineProps<{
    context: Exclude<MapContextState, { kind: 'closed' }>
    embedded?: boolean
  }>(),
  { embedded: false },
)
const emit = defineEmits<{
  close: []
  openCamera: [camera: CameraApiItem]
  inspectCamera: [camera: CameraApiItem]
}>()
const api = new FloodCameraMonitoringApi()
const detail = ref<CameraApiItem | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)
let generation = 0
let controller: AbortController | null = null
let detailCompletedAt = 0
let detailTimer: number | null = null
const summary = computed(() =>
  props.context.kind === 'camera' ? props.context.camera : null,
)
const presented = computed(() => detail.value ?? summary.value)

async function loadCameraDetail(camera: CameraApiItem | null, reset = false) {
  const request = ++generation
  controller?.abort()
  controller = null
  if (reset) {
    detail.value = null
    detailError.value = null
  }
  detailLoading.value = Boolean(camera)
  if (!camera) return
  controller = new AbortController()
  try {
    const result = await api.getCamera(camera.id, controller.signal)
    if (request === generation) {
      detail.value = result
      detailError.value = null
      detailCompletedAt = Date.now()
    }
  } catch (error) {
    if (
      request === generation &&
      !(error instanceof DOMException && error.name === 'AbortError')
    ) {
      detailError.value = 'Não foi possível carregar os detalhes desta câmera.'
    }
  } finally {
    if (request === generation) detailLoading.value = false
  }
}

watch(summary, (camera) => void loadCameraDetail(camera, true), { immediate: true })

const revalidateDetail = () => {
  if (
    summary.value &&
    document.visibilityState === 'visible' &&
    navigator.onLine &&
    Date.now() - detailCompletedAt > 30_000
  ) {
    void loadCameraDetail(summary.value)
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  detailTimer = window.setInterval(() => {
    if (
      summary.value &&
      document.visibilityState === 'visible' &&
      navigator.onLine
    ) {
      void loadCameraDetail(summary.value)
    }
  }, 60_000)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('focus', revalidateDetail)
  window.addEventListener('online', revalidateDetail)
  document.addEventListener('visibilitychange', revalidateDetail)
})
onBeforeUnmount(() => {
  generation += 1
  controller?.abort()
  if (detailTimer !== null) window.clearInterval(detailTimer)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('focus', revalidateDetail)
  window.removeEventListener('online', revalidateDetail)
  document.removeEventListener('visibilitychange', revalidateDetail)
})
</script>

<template>
  <aside
    class="max-h-[52dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-[#001C3B]/95"
    :class="
      embedded
        ? 'relative w-full'
        : 'absolute inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 md:top-16 md:right-3 md:bottom-4 md:left-auto md:w-[min(26rem,35vw)]'
    "
    aria-label="Contexto do mapa"
    aria-live="polite"
    @click.stop
    @pointerdown.stop
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold tracking-wider text-[#2768CA] uppercase">
          {{ context.kind === 'camera' ? 'Câmera' : context.kind === 'flood' ? 'Ponto ativo' : 'Território' }}
        </p>
        <h2 class="mt-1 text-lg font-semibold">
          {{
            context.kind === 'camera'
              ? presented?.description
              : context.kind === 'flood'
                ? context.flood.neighborhoodSummary
                : context.territory.neighborhood
          }}
        </h2>
      </div>
      <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full hover:bg-slate-100 focus-visible:outline-3 focus-visible:outline-[#2768CA] dark:hover:bg-slate-800" aria-label="Fechar contexto do mapa" @click="emit('close')">
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>

    <template v-if="context.kind === 'camera'">
      <div class="mt-3 aspect-video overflow-hidden rounded-xl bg-[#00182F]">
        <div v-if="detailLoading && !detail" class="grid h-full place-items-center text-sm text-white" role="status">Carregando transmissão...</div>
        <div v-else-if="detailError && !detail" class="grid h-full place-items-center p-4 text-center text-sm text-white" role="alert">{{ detailError }}</div>
        <HlsPlayer v-else-if="presented?.video_hls" :key="presented.id" :src="presented.video_hls" autoplay muted controls lock-to-live />
        <div v-else class="grid h-full place-items-center p-4 text-center text-sm text-white">Transmissão não configurada.</div>
      </div>
      <div v-if="presented" class="mt-3"><CameraStatusBadge :camera="presented" /></div>
      <p v-if="presented" class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ cameraAddressLabel(presented) }}</p>
      <button v-if="presented" type="button" class="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#2768CA] px-4 text-sm font-semibold text-white" @click="emit('inspectCamera', presented)">
        Inspecionar câmera
      </button>
    </template>

    <template v-else-if="context.kind === 'flood'">
      <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><dt class="text-slate-500">Probabilidade do ponto cadastrado</dt><dd class="font-semibold">{{ context.flood.probability }}%</dd></div>
        <div><dt class="text-slate-500">Duração</dt><dd class="font-semibold">{{ context.flood.duration }} min</dd></div>
      </dl>
      <p class="mt-2 text-xs text-slate-600 dark:text-slate-300">
        Bairros: {{ context.flood.neighborhoods.map((item) => item.name).join(', ') }}
      </p>
      <section v-if="context.cameras.length" class="mt-4">
        <h3 class="text-sm font-semibold">Câmeras relacionadas</h3>
        <ul class="mt-2 grid gap-2">
          <li v-for="camera in context.cameras" :key="camera.id">
            <button type="button" class="flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-200 px-3 text-left text-sm dark:border-slate-700" @click="emit('openCamera', camera)">
              <span>{{ camera.description }}</span><span>{{ cameraPresentation(camera).label }}</span>
            </button>
          </li>
        </ul>
      </section>
    </template>

    <template v-else>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ context.territory.city }}</p>
      <section v-if="context.cameras.length" class="mt-4">
        <h3 class="text-sm font-semibold">Câmeras</h3>
        <ul class="mt-2 grid gap-2">
          <li v-for="camera in context.cameras" :key="camera.id">
            <button
              type="button"
              class="block min-h-11 w-full rounded-lg border border-slate-200 p-3 text-left text-sm focus-visible:outline-3 focus-visible:outline-[#2768CA] dark:border-slate-700"
              @click="emit('openCamera', camera)"
            >
              <strong>{{ camera.description }}</strong>
              <span class="mt-1 block text-xs">{{ cameraPresentation(camera).label }}</span>
              <span class="mt-2 block text-xs font-semibold text-[#2768CA]">
                Ver transmissão
              </span>
            </button>
          </li>
        </ul>
      </section>
      <section v-if="context.points.length" class="mt-4">
        <h3 class="text-sm font-semibold">Pontos ativos</h3>
        <ul class="mt-2 grid gap-2">
          <li v-for="point in context.points" :key="point.id" class="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <strong>{{ point.neighborhoodSummary }}</strong>
            <span class="mt-1 block text-xs">Probabilidade territorial: {{ point.probability }}% · {{ point.duration }} min</span>
          </li>
        </ul>
      </section>
    </template>
  </aside>
</template>
