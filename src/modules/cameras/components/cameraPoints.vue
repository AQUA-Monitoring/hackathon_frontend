<script setup lang="ts">
import { computed, ref } from 'vue'
import { CameraItems } from '../components'
import type { CameraWithPrediction } from '@/modules/cameras'
import { riskLabel } from '@/utils/flood'

const props = defineProps<{ cams: CameraWithPrediction[] }>()
const currentIndex = ref(0)
const currentCamera = computed(() => props.cams[currentIndex.value] ?? null)

const next = () => {
  currentIndex.value = props.cams.length ? (currentIndex.value + 1) % props.cams.length : 0
}
const prev = () => {
  currentIndex.value = props.cams.length
    ? (currentIndex.value - 1 + props.cams.length) % props.cams.length
    : 0
}
</script>

<template>
  <section class="mt-5">
    <h3 class="mb-3 text-xl font-bold">Câmeras prioritárias</h3>
    <div v-if="cams.length" class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <div class="flex items-center justify-between gap-3">
        <button
          type="button"
          class="grid size-10 place-items-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Câmera anterior"
          @click="prev"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <div v-if="currentCamera" class="text-center">
          <p class="truncate font-semibold">{{ currentCamera.name }}</p>
          <CameraItems :cam="currentCamera" class="mx-auto my-5 w-full max-w-75 rounded-xl" />
          <p class="text-sm text-slate-600 dark:text-slate-300">
            {{ riskLabel(currentCamera.flood_percentage) }}
          </p>
        </div>
        <button
          type="button"
          class="grid size-10 place-items-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Próxima câmera"
          @click="next"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <RouterLink
        :to="`/cameras/${currentCamera?.id}`"
        class="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-[#2768CA] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1f57ad]"
        >Inspecionar</RouterLink
      >
    </div>
    <p v-else class="text-sm text-slate-500">Nenhuma câmera disponível.</p>
  </section>
</template>
