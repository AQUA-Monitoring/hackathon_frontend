<script setup lang="ts">
import { FilterButton, SupportCard } from '@/components'

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
</script>

<template>
  <section>
    <p class="text-center text-5xl font-semibold mt-10 mb-20">Suporte</p>

    <div class="flex">
      <div class="flex ml-15">
        <span class="material-symbols-outlined mt-1 size-5 align-middle mr-6 rotate-90">
          instant_mix
        </span>
        <p class="text-md font-semibold text-xl">Filtrar atendimentos</p>
      </div>

      <ul class="flex ml-15">
        <li class="mr-8">
          <FilterButton title="Categoria" :options="['Financeiro', 'Sistema', 'Cadastro']" />
        </li>
        <li>
          <FilterButton title="Status" :options="['Concluído', 'Pendente']" />
        </li>
      </ul>
    </div>
  </section>

  <section class="px-14">
    <div class="grid grid-cols-5 gap-6 mt-8">
      <SupportCard
        v-for="support in supports"
        :key="support.id"
        :support="support"
        @details="handleDetails"
      />
    </div>
  </section>
</template>
