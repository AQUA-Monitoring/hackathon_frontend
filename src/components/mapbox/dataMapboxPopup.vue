<script setup lang="ts">
defineProps<{
  neighborhood: string | null
  city: string | null
  probability?: number | null
}>()
</script>

<template>
  <div
    class="absolute bottom-25 left-1/2 -translate-x-1/2 w-[90%] rounded-2xl p-4 bg-white dark:bg-[#001C3B] grid gap-3 text-[#999999]"
  >
    <div>
      <h4 class="text-black dark:text-white text-lg font-semibold">{{ neighborhood }}</h4>
      <p class="flex gap-1 items-center text-sm">
        <span class="material-symbols-outlined scale-90"> location_on </span> {{ city }}
      </p>
    </div>
    <p class="grid gap-1 items-center text-xs font-semibold">
      Probablidade
      <span class="text-2xl text-[#FF2020] font-bold">{{ probability ?? 0 }}%</span>
    </p>
  </div>
</template>
