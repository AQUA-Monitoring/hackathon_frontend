<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CamerasComp } from '@/modules/cameras'
import { SelectFloodAlert } from '@/components'
import { MapboxComp, TablePoints } from '@/modules/flood-map'
import { useCamerasMonitoring } from '@/modules/cameras'
import type { AlertKey } from '@/types/alert'
import { useAuthStore } from '@/modules/auth'
import { useFloodPointsMap } from '@/modules/flood-points'
import { useNotificationsStore } from '@/modules/notifications'
const { user } = useAuthStore()
const { tablePoints } = useFloodPointsMap()

const { camerasWithPrediction } = useCamerasMonitoring()
const currentAlert = ref<AlertKey>('CRISE!')
const notifications = useNotificationsStore()

onMounted(() => notifications.loadOpenCount().catch(() => undefined))
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

      <RouterLink
        to="/admin/alertas"
        class="my-4 flex items-center justify-between rounded-2xl border border-[#2768CA]/30 bg-[#2768CA]/10 p-4 text-[#0750AF] dark:text-blue-200"
      >
        <span><strong class="block">Alertas operacionais</strong><small>Indícios aguardando revisão humana</small></span>
        <span class="rounded-full bg-[#2768CA] px-3 py-1 font-semibold text-white" :aria-label="`${notifications.openCount} indícios abertos`">{{ notifications.openCount }}</span>
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
