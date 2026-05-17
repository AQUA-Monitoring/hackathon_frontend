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

const supports: Support[] = [
  {
    id: 1,
    code: '001',
    requestedAt: '17/05/2026',
    category: 'Financeiro',
    status: 'Aberto'
  },
  {
    id: 2,
    code: '002',
    requestedAt: '15/05/2026',
    category: 'Sistema',
    status: 'Pendente'
  },
  {
    id: 3,
    code: '003',
    requestedAt: '10/05/2026',
    category: 'Cadastro',
    status: 'Fechado'
  },
  {
    id: 3,
    code: '003',
    requestedAt: '10/05/2026',
    category: 'Cadastro',
    status: 'Fechado'
  },
  {
    id: 3,
    code: '003',
    requestedAt: '10/05/2026',
    category: 'Cadastro',
    status: 'Fechado'
  },
  {
    id: 3,
    code: '003',
    requestedAt: '10/05/2026',
    category: 'Cadastro',
    status: 'Fechado'
  }
]

const handleDetails = (support: Support): void => {
  console.log('Ver detalhes:', support)
}
</script>

<template>
  <section>
    <headerComp />

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


</template>
