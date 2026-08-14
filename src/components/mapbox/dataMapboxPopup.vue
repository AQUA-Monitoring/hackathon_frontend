<script setup lang="ts">
import { computed } from 'vue'
import { CameraItems } from '@/modules/cameras/components'
import { useCamerasMonitoring } from '@/modules/cameras/composables/useCamerasMonitoring'

defineProps<{
  neighborhood: string | null
  city: string | null
  probability?: number | null
}>()

const { cameras } = useCamerasMonitoring()
const firstCamera = computed(() => cameras.value[0] ?? null)
</script>

<template>
  <div
    class="flex gap-5 absolute bottom-25 left-1/2 -translate-x-1/2 w-[90%] rounded-2xl p-4 bg-white dark:bg-[#001C3B]"
  >
    <div v-if="firstCamera" class="flex w-[50%] justify-center rounded-2xl overflow-hidden">
      <CameraItems :cam="firstCamera" />
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
        <span class="text-2xl text-[#FF2020] font-bold">
          {{ probability === null || probability === undefined ? 'Indisponível' : `${probability}%` }}
        </span>
      </p>
    </div>
  </div>
</template>
