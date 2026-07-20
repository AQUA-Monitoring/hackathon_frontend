<script setup lang="ts">
import { ref } from 'vue'
import { MapboxComp, TablePoints, CamerasComp, SelectFloodAlert } from '@/components'
import { useCamerasMonitoring } from '@/modules/cameras'
import type { AlertKey } from '@/types/alert'
import { useAuthStore } from '@/stores/auth'
import { useFloodPointsMap } from '@/composables/useFloodPointsMap'
const { user } = useAuthStore()
const { tablePoints } = useFloodPointsMap()

const { camerasWithPrediction } = useCamerasMonitoring()
const currentAlert = ref<AlertKey>('CRISE!')
</script>

<template>
  <section class="grid lg:flex justify-between gap-10 px-10 lg:px-0">
    <div class="mt-5 lg:w-[40%]">
      <h1 class="font-semibold text-5xl hidden lg:block">Área de Administração</h1>
      <p class="text-[#0453AF] font-semibold text-xl mt-2 mb-5 lg:mb-10">
        Bem-vindo, {{ user?.name }}!
      </p>

      <RouterLink
        to="/admin/registrar-ponto"
        class="bg-[#2768CA]/20 text-[#2768CA] rounded-2xl w-full py-2 flex flex-col justify-center items-center lg:hidden"
      >
        <span class="material-symbols-outlined">add</span>
        <span> Adicionar ponto </span>
      </RouterLink>

      <div class="gap-5 hidden lg:grid">
        <TablePoints :points="tablePoints" />
        <CamerasComp :cams="camerasWithPrediction" />
      </div>
    </div>

    <div class="lg:w-[60%]">
      <SelectFloodAlert v-model:alert="currentAlert" />
      <MapboxComp />
    </div>

    <div class="grid gap-5 lg:hidden">
      <CamerasComp :cams="camerasWithPrediction" />
      <TablePoints :points="tablePoints" />
    </div>
  </section>

  <!-- <section class="grid justify-between gap-10 px-10 md:px-0">
    <div class="mt-5 md:w-[40%]">
      <h1 class="font-semibold text-5xl hidden">Área de Administração</h1>
      <p class="text-[#0453AF] font-semibold text-xl mt-2 md:mb-10">Bem-vindo, {{ user?.name }}!</p>

      <RouterLink
        to="/admin/registrar-ponto"
        class="bg-[#2768CA]/20 text-[#2768CA] rounded-2xl w-full py-2 flex flex-col justify-center items-center my-5 md:hidden"
      >
        <span class="material-symbols-outlined">add</span>
        <span> Adicionar ponto </span>
      </RouterLink>

      <div class="grid gap-5">
        <TablePoints :points="tablePoints" />
        <CamerasComp :cams="camerasWithPrediction" />
      </div>
    </div>

    <div class="md:w-[60%]">
      <SelectFloodAlert v-model:alert="currentAlert" />
      <MapboxComp />
    </div>
  </section> -->
</template>
