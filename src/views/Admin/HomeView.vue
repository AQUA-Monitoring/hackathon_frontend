<script setup lang="ts">
import { ref } from 'vue'
import { MapboxComp, TablePoints, CamerasComp, SelectFloodAlert } from '@/components'
import { useCamerasMonitoring } from '@/composables/useCamerasMonitoring'
import type { AlertKey } from '@/types/alert'
import { useAuthStore } from '@/stores/auth'
import { useFloodPointsMap } from '@/composables/useFloodPointsMap'
const { user } = useAuthStore()
const { tablePoints } = useFloodPointsMap()

const { camerasWithPrediction } = useCamerasMonitoring()
const currentAlert = ref<AlertKey>('CRISE!')
</script>

<template>
  <section class="flex justify-between gap-10">
    <div class="mt-5 w-[40%]">
      <h1 class="font-semibold text-5xl">Área de Administração</h1>
      <p class="text-[#0453AF] font-semibold text-xl mt-2 mb-10">Bem-vindo, {{ user?.name }}!</p>

      <div class="grid gap-5">
        <TablePoints :points="tablePoints" />
        <CamerasComp :cams="camerasWithPrediction" />
      </div>
    </div>

    <div class="w-[60%]">
      <SelectFloodAlert v-model:alert="currentAlert" />
      <MapboxComp />
    </div>
  </section>
</template>
