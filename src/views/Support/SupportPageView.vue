<script setup lang="ts">
import headerComp from '@/components/general/headerComp.vue'
import FilterButton from '@/components/buttons/filterButton.vue'
import SupportCard from '@/components/cards/supportCard.vue'

interface Support {
  id: number
  code: string
  requestedAt: string
  category: string
  status: string
}

const handleDetails = (support: Support): void => {
  console.log('Ver detalhes:', support)
}
const supports: Support[] = [
  {
    id: 1,
    code: '001',
    requestedAt: '17/05/2026',
    category: 'Financeiro',
    status: 'Concluído'
  },
  {
    id: 2,
    code: '002',
    requestedAt: '15/05/2026',
    category: 'Sistema',
    status: 'Pendente'
  }
]

</script>

<template>
  <section>
    <headerComp />

    <h1 class="text-center text-2xl md:text-5xl font-semibold mt-5 mb-10 md:mt-10 md:mb-20">Suporte</h1>


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
  </section>

  <section class="px-14">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-10  md:gap-8 mt-10 md:mt-8">
      <SupportCard v-for="support in supports" :key="support.id" :support="support" @details="handleDetails" />
    </div>
  </section>
</template>
