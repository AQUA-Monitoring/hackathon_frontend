<script setup lang="ts">
import { computed } from 'vue'
import CameraStatusBadge from './CameraStatusBadge.vue'
import type { CameraApiItem } from '../types/camera'
import { cameraAddressLabel, formatCameraDate } from '../utils/cameraPresentation'
import CameraPreview from './CameraPreview.vue'

const props = withDefaults(
  defineProps<{
    camera: CameraApiItem
    selected?: boolean
    density?: 'comfortable' | 'compact'
    previewsPaused?: boolean
  }>(),
  { density: 'comfortable' },
)
const emit = defineEmits<{ select: [camera: CameraApiItem] }>()
const analyzedAt = computed(() => props.camera.operational.analysis.analyzed_at)
const showAnalysisDate = computed(() => props.camera.status !== 'OFFLINE')
</script>

<template>
  <article
class="flex h-full min-w-0 flex-col rounded-3xl border bg-white shadow-sm transition dark:bg-[#001C3B]"
    :class="[
      density === 'compact' ? 'p-3' : 'p-4',
      selected
        ? 'border-[#2768CA] ring-3 ring-[#2768CA]/15'
        : 'border-slate-200 dark:border-slate-700',
    ]"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p
          v-if="density === 'comfortable'"
          class="text-xs font-semibold tracking-[0.12em] text-[#2768CA] uppercase"
        >
          {{ camera.status === 'OFFLINE' ? 'Câmera offline' : 'Análise automática' }}
        </p>
        <h2 class="mt-1 line-clamp-2 min-h-5 text-base font-semibold">{{ camera.description }}</h2>
      </div>
      <span class="material-symbols-outlined shrink-0 text-[#2768CA]" aria-hidden="true"
        >videocam</span
      >
    </div>

    <div class="mt-4 aspect-video overflow-hidden rounded-2xl">
      <CameraPreview :camera="camera" :previews-paused="previewsPaused" :selected="selected" />
    </div>

    <p
      class="mt-3 text-sm text-slate-600 dark:text-slate-300"
      :class="density === 'compact' ? 'line-clamp-1' : 'line-clamp-2 min-h-10'"
    >
      <span class="material-symbols-outlined mr-1 align-middle text-base" aria-hidden="true"
        >location_on</span
      >
      {{ cameraAddressLabel(camera) }}
    </p>

    <div class="mt-4 min-h-0 ">
      <CameraStatusBadge :camera="camera" />
    </div>

    <div
      class="mt-auto flex min-h-15 items-end gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 justify-between"
    >
      <p
        v-if="density === 'comfortable' && showAnalysisDate"
        class="text-xs text-slate-500 dark:text-slate-400"
      >
        <span class="block">Última análise</span>
        <span class="font-medium text-slate-700 dark:text-slate-200">{{
          formatCameraDate(analyzedAt)
        }}</span>
      </p>
      <div class="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300"
        :class="camera.status === 'OFFLINE' ? 'mr-auto' : ''">
        <p v-if="camera.status === 'OFFLINE'">Sem análise automática</p>
      </div>

      <button
        type="button"
        class="min-h-11 rounded-xl bg-[#2768CA] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1F57AD] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA]"
        :class="density === 'compact' ? 'w-full' : ''"
        @click="emit('select', camera)"
      >
        Inspecionar
      </button>
    </div>
  </article>
</template>
