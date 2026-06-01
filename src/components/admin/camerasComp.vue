<script setup lang="ts">
import { CameraItems } from '@/components'
import type { CameraWithPrediction } from '@/types/predictions'
import { displayFloodPercent } from '@/utils/flood'

defineProps<{
  cams: CameraWithPrediction[]
}>()
</script>

<template>
  <div class="grid w-full items-center">
    <h3 class="mb-4 text-xl font-bold">Altas probabilidades</h3>

    <div class="grid grid-cols-2 overflow-hidden rounded-2xl">
      <div
        v-for="(cam, index) in cams.slice(0, 4)"
        :key="index"
        class="relative flex w-full items-center justify-center"
      >
        <CameraItems :cam="cam" />

        <span
          :class="[
            'absolute top-2 text-white font-bold text-xl border border-transparent bg-[#7AA6C8]/30 px-3 py-1 shadow-xl backdrop-blur-xs rounded-full',
            index % 2 === 0 ? 'right-2' : 'left-2',
          ]"
        >
          {{ displayFloodPercent(cam) }}%
        </span>
      </div>
    </div>
  </div>
</template>
