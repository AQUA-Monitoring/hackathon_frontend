<script setup lang="ts">
import { ref } from 'vue'
import { FilterButton } from '@/shared'
import SupportCard from '../SupportCard.vue'
import { type ISupport, supports } from '../supportTypes'

const showPopUp = ref(false)
const selectedSupport = ref<ISupport | null>(null)

const openPopUp = (support: ISupport) => {
  selectedSupport.value = support
  showPopUp.value = true
}
</script>

<template>
  <section class="px-10 py-5 lg:py-0">
    <h1 class="text-center text-4xl font-semibold mt-10 mb-20 hidden lg:block">Suporte</h1>

    <div class="md:flex grid gap-5 md:gap-10 items-center justify-between lg:justify-start">
      <p class="flex items-center gap-2 font-semibold">
        <span class="material-symbols-outlined align-middle"> tune </span>
        Filtrar atendimentos
      </p>

      <div class="flex gap-3">
        <FilterButton title="Categoria" :options="['Financeiro', 'Sistema', 'Cadastro']" />
        <FilterButton title="Status" :options="['Concluído', 'Pendente']" />
      </div>
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-8"
    >
      <SupportCard
        v-for="support in supports"
        :key="support.id"
        :support="support"
        @open="openPopUp"
      />
    </div>
  </section>
</template>
