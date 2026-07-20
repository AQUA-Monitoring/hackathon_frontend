<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    title?: string
    allowFullscreen?: boolean
    timeoutMs?: number
  }>(),
  {
    allowFullscreen: true,
    timeoutMs: 12000,
  },
)

const iframeRef = ref<HTMLIFrameElement | null>(null)
const loaded = ref(false)
const timedOut = ref(false)
let timer: number | null = null

function clearTimer() {
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
}

function startTimer() {
  clearTimer()
  timer = window.setTimeout(() => {
    if (!loaded.value) timedOut.value = true
  }, props.timeoutMs)
}

function onLoad() {
  loaded.value = true
  timedOut.value = false
  clearTimer()
}

function reload() {
  loaded.value = false
  timedOut.value = false
  startTimer()
  const el = iframeRef.value
  if (el) el.src = props.src
}

onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <div class="relative h-full w-full">
    <iframe
      ref="iframeRef"
      :src="src"
      :title="title ?? 'Live Embed'"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      :allowfullscreen="allowFullscreen"
      loading="eager"
      referrerpolicy="no-referrer-when-downgrade"
      class="h-full w-full"
      style="border: 0"
      @load="onLoad"
    />

    <div v-if="!loaded && !timedOut" class="absolute inset-0 grid place-items-center bg-black/20">
      <div class="flex items-center gap-2 text-gray-400 text-sm animate-pulse">
        <span class="material-symbols-outlined animate-spin">sync</span>
        Carregando embed
      </div>
    </div>

    <div v-if="timedOut" class="absolute inset-0 grid place-items-center bg-black/30">
      <div class="w-72 rounded-lg bg-white p-4 text-center shadow dark:bg-slate-800">
        <div class="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Sem resposta do embed
        </div>
        <p class="mb-3 text-xs text-slate-600 dark:text-slate-300">
          O provedor pode bloquear iframes ou estar lento. Abra em nova aba ou tente novamente.
        </p>
        <div class="flex justify-center gap-2">
          <a
            :href="src"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Abrir em nova aba
          </a>
          <button
            type="button"
            class="rounded-md bg-slate-700 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            @click="reload"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
