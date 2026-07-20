<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CameraWithPrediction } from '@/types/predictions'
import { legacyCameraAnalysisLabel } from '@/utils/cameraPresentation'

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
          class="grid size-11 place-items-center rounded-full"
          aria-label="Câmera anterior"
          @click="prev"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <div class="min-w-0 text-center">
          <p class="truncate font-semibold">{{ currentCamera?.name }}</p>
          <p v-if="currentCamera" class="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {{ legacyCameraAnalysisLabel(currentCamera) }}
          </p>
        </div>
        <button
          type="button"
          class="grid size-11 place-items-center rounded-full"
          aria-label="Próxima câmera"
          @click="next"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <RouterLink
        :to="`/cameras/${currentCamera?.id}`"
        class="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-[#2768CA] px-4 text-sm font-semibold text-white"
        >Inspecionar</RouterLink
      >
    </div>
    <p v-else class="text-sm text-slate-500">Nenhuma câmera disponível.</p>
  </section>
</template>
