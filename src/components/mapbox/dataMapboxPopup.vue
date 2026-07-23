<script setup lang="ts">
import { CameraItems } from '@/modules/cameras/components'
import { useCamerasMonitoring } from '@/modules/cameras/composables/useCamerasMonitoring'

defineProps<{
  neighborhood: string | null
  city: string | null
  probability?: number | null
}>()

const { camerasWithPrediction } = useCamerasMonitoring()
</script>

<template>
  <div
    class="flex gap-5 absolute bottom-25 left-1/2 -translate-x-1/2 w-[90%] rounded-2xl p-4 bg-white dark:bg-[#001C3B]"
  >
    <div class="flex w-[50%] justify-center rounded-2xl overflow-hidden">
      <CameraItems :cam="camerasWithPrediction[0]" />
    </div>

    <div class="grid gap-3 text-[#999999]">
      <div>
        <h4 class="text-black dark:text-white text-lg font-semibold">{{ neighborhood }}</h4>
        <p class="flex gap-1 items-center text-sm">
          <span class="material-symbols-outlined scale-90"> location_on </span> {{ city }}
        </p>
      </div>
      <p class="grid gap-1 items-center text-xs font-semibold">
        Probablidade
        <span class="text-2xl text-[#FF2020] font-bold">{{ probability ?? 0 }}%</span>
      </p>
    </div>
  </div>
</template>
