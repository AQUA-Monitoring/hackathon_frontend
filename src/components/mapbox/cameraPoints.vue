<script setup lang="ts">
import { ref } from 'vue'
import { CameraItems } from '@/components'
import type { CameraWithPrediction } from '@/types/predictions'
import { riskLabel, riskClass, displayFloodPercent } from '@/utils/flood'

const props = defineProps<{
  cams: CameraWithPrediction[]
}>()

const currentIndex = ref(0)

const next = () => {
  if (currentIndex.value < props.cams.slice(0, 4).length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = 3
  }
}
</script>

<template>
  <div class="grid w-full items-center mt-5">
    <h3 class="mb-4 text-xl font-bold">Altas probabilidades</h3>

    <div class="relative mx-auto h-[13vw] min-h-50 w-[80%] overflow-hidden rounded-2xl">
      <span
        @click="prev"
        class="material-symbols-outlined absolute top-1/2 left-2 z-10 -translate-y-1/2 cursor-pointer text-white"
      >
        chevron_left
      </span>

      <div
        class="flex h-full transition-transform duration-500"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <div
          v-for="cam in cams"
          :key="cam.id"
          class="flex min-w-full flex-col items-center justify-center"
        >
          <div class="flex w-full justify-center rounded-2xl overflow-hidden">
            <CameraItems :cam="cam" />
          </div>
        </div>
      </div>

      <span
        @click="next"
        class="material-symbols-outlined absolute top-1/2 right-2 z-10 -translate-y-1/2 cursor-pointer text-white"
      >
        chevron_right
      </span>
    </div>

    <div class="relative mx-auto w-[80%] overflow-hidden">
      <div
        class="flex h-full transition-transform duration-500"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <div v-for="cam in cams" :key="cam.id" class="min-w-full">
          <p class="font-semibold">Situação:</p>
          <p :class="riskClass(displayFloodPercent(cam))">
            {{ riskLabel(displayFloodPercent(cam)) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
