<script setup lang="ts">
import { CameraItems } from '.'
import type { CameraSummary } from '../types/camera'
import { formatFloodPercent, riskClass } from '@/utils/flood'

defineProps<{
  cams: CameraSummary[]
}>()
</script>

<template>
  <div class="grid w-full items-center">
    <h3 class="mb-4 text-xl font-bold">Câmeras prioritárias</h3>

    <div class="grid grid-cols-2 overflow-hidden rounded-2xl">
      <div
        v-for="(cam, index) in cams.slice(0, 4)"
        :key="index"
        class="relative flex w-full items-center justify-center"
      >
        <CameraItems :cam="cam" />

        <span
          :class="[
            'absolute top-2 text-white font-bold text-xl border border-transparent px-3 py-1 shadow-xl backdrop-blur-xs rounded-full',
            index % 2 === 0 ? 'right-2' : 'left-2',
            cam.floodPercentage === null ? 'bg-slate-700/50' : 'bg-white/30',
            riskClass(cam.floodPercentage),
          ]"
        >
          {{ formatFloodPercent(cam) }}
        </span>
      </div>
    </div>
  </div>
</template>
