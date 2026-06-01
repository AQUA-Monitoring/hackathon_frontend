<script setup lang="ts">
import { ref } from 'vue'
import { MapboxComp, TablePoints, CamerasComp, SelectFloodAlert } from '@/components'
import { useCamerasMonitoring } from '@/composables/useCamerasMonitoring'
import type { IMenu } from '@/types/general/menu'
import type { AlertKey } from '@/types/alert'

const { camerasWithPrediction } = useCamerasMonitoring()
const currentAlert = ref<AlertKey>('CRISE!')

const menu: IMenu = {
  id: 'menu',
  options: [
    {
      label: 'Cadastre um novo ponto de alagamento',
      icon: 'add',
      link: '/admin/mapa-de-alagamento',
    },
    {
      label: 'Emitir Notificação',
      icon: 'notifications_active',
      link: '/admin/registrar-notificacao',
    },
    { label: 'Histórico de cadastros', icon: 'schedule', link: '/admin/historico' },
    {
      label: 'Cadastrar ocorrência',
      icon: 'report',
      link: '/admin/registrar-ocorrencia',
    },
  ],
}
</script>

<template>
  <section class="flex justify-between">
    <nav class="bg-[#0453AF] rounded-full text-white w-20">
      <ul class="grid justify-center gap-7 px-5 py-10">
        <li v-for="(item, index) in menu.options" :key="index">
          <RouterLink :to="item.link">
            <span class="material-symbols-outlined">{{ item.icon }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="mt-5 w-[35%]">
      <h1 class="font-semibold text-5xl">Área de Administração</h1>
      <p class="text-[#0453AF] font-semibold text-xl mt-2 mb-10">Bem-vindo, Fulano!</p>

      <div class="grid gap-5">
        <TablePoints :points="[]" />
        <CamerasComp :cams="camerasWithPrediction" />
      </div>
    </div>

    <div class="w-[55%]">
      <SelectFloodAlert v-model:alert="currentAlert" />
      <MapboxComp />
    </div>
  </section>
</template>
