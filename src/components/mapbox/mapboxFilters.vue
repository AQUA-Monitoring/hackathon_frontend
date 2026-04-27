<script setup lang="ts">
interface fields {
  start: string
  end: string
}

const fields: fields[] = [
  { start: '81%', end: '100%' },
  { start: '61%', end: '80%' },
  { start: '41%', end: '60%' },
  { start: '21%', end: '40%' },
  { start: '0%', end: '20%' },
]
</script>

<template>
  <div
    class="absolute top-5 right-5 rounded-2xl bg-white p-5 text-center font-semibold dark:bg-[#001C3B]"
  >
    <h3 class="text-lg">Legendas</h3>
    <p class="text-xs">Probabilidade de alagamento</p>

    <div class="mt-5 flex justify-center gap-3">
      <div class="h-30 w-5 rounded-lg bg-linear-to-b from-[#0047AB] to-[#00B2A9]"></div>
      <ul class="grid h-32 justify-between">
        <li v-for="field in fields" :key="field.start" class="text-left text-xs">
          {{ field.end }} - {{ field.start }}
        </li>
      </ul>
    </div>
  </div>
</template>
