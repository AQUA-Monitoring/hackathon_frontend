<script setup lang="ts">
import headerComp from '@/components/general/headerComp.vue';
import baseButton from '@/components/buttons/baseButton.vue';
import FilterButton from '@/components/buttons/filterButton.vue';
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
          <FilterButton title="Categoria" :options="['0', '1', '2']" />
        </li>
        <li>
          <FilterButton title="Status" :options="['Concluído', 'Pendente']" />
        </li>
      </ul>

    </div>

  </section>
</template>
