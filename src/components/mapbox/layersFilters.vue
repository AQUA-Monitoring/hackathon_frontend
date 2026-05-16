<script setup lang="ts">
const filters: string[] = ['Visão Geral', 'Especialista', 'IA']
</script>

<template>
  <div
    class="absolute md:right-2 top-20 right-5 md:bottom-5 rounded-2xl bg-white p-5 text-center font-semibold dark:bg-[#001C3B]"
  >
    <h3 class="mb-4 text-lg">Camadas</h3>

    <ul class="grid gap-1">
      <li
        v-for="(filter, index) in filters"
        :key="index"
        class="flex cursor-pointer items-center gap-1 text-left text-sm font-normal hover:text-[#001C3B]"
      >
        <span class="material-symbols-outlined"> arrow_right_alt </span>
        {{ filter }}
      </li>
    </ul>
  </div>
</template>
