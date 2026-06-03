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
    <h1 class="text-center text-4xl font-semibold mt-10 mb-20">Suporte</h1>

    <div class="flex gap-10 items-center ml-15">
      <p class="flex items-center gap-2 font-semibold">
        <span class="material-symbols-outlined align-middle"> tune </span>
        Filtrar atendimentos
      </p>

      <div class="flex gap-3">
        <FilterButton title="Categoria" :options="['Financeiro', 'Sistema', 'Cadastro']" />
        <FilterButton title="Status" :options="['Concluído', 'Pendente']" />
      </div>
    </div>

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
