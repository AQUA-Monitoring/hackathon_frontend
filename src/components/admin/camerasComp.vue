<script setup lang="ts">
import { computed } from 'vue'
import type { CameraWithPrediction } from '@/types/predictions'
import { legacyCameraAnalysisLabel } from '@/modules/cameras'

const props = defineProps<{ cams: CameraWithPrediction[] }>()

const visibleCameras = computed(() => props.cams.slice(0, 4))
</script>

<template>
  <section class="grid w-full gap-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold">Câmeras prioritárias</h3>
      <RouterLink to="/cameras" class="text-sm font-semibold text-[#2768CA]">Ver todas</RouterLink>
    </div>
    <div class="grid gap-2 sm:grid-cols-2">
      <RouterLink
        v-for="camera in visibleCameras"
        :key="camera.id"
        :to="`/cameras/${camera.id}`"
        class="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#2768CA] dark:border-slate-700 dark:bg-[#001C3B]"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="line-clamp-2 text-sm font-semibold">{{ camera.name }}</p>
          <span class="material-symbols-outlined text-[#2768CA]">videocam</span>
        </div>
        <p class="mt-3 text-xs text-slate-600 dark:text-slate-300">
          {{ legacyCameraAnalysisLabel(camera) }}
        </p>
      </RouterLink>
    </div>
  </section>
</template>
