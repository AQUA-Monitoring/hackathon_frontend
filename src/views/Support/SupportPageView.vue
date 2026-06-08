<script setup lang="ts">
import { ref } from 'vue'
import { FilterButton, SupportCard } from '@/components'

interface Support {
  id: number
  code: string
  requestedAt: string
  category: string
  status: string
}

const supports: Support[] = [
  {
    id: 1,
    code: '001',
    requestedAt: '17/05/2026',
    category: 'Financeiro',
    status: 'Concluído',
  },
  {
    id: 2,
    code: '002',
    requestedAt: '15/05/2026',
    category: 'Sistema',
    status: 'Pendente',
  },
]

const showPopUp = ref(false)

const selectedSupport = ref<Support | null>(null)

  const openPopUp = (support: Support) => {
  selectedSupport.value = support
  showPopUp.value = true
}

</script>

<template>
  <section>

    <div class="md:flex">

        <p class="text-xl font-semibold flex ml-8 mb-8 md:mb-0 md:ml-15 md:mt-2">
          <span class="material-symbols-outlined align-middle mr-3 md:mr-6 rotate-90 size-0 mt-0.5 md:size-1 md:mt-1">
            instant_mix
          </span>Filtrar atendimentos</p>

      <ul class="flex ml-5 md:ml-15">
        <li class="mr-1 md:mr-8">
          <FilterButton title="Categoria" :options="['Financeiro', 'Sistema', 'Cadastro']" />
        </li>
        <li>
          <FilterButton title="Status" :options="['Concluído', 'Pendente']" />
        </li>
      </ul>

    </div>

  <section class="px-14">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-10  md:gap-8 mt-10 md:mt-8">
      <SupportCard v-for="support in supports" :key="support.id" :support="support" @open="openPopUp" />
    </div>
  </section>

</template>
