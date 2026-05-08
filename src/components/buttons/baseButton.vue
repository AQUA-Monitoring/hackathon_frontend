<script setup lang="ts">
defineProps<{
  buttonText: string
}>()
</script>

<template>
  <button
    class="bg-[#2966C1] rounded-full text-white text-lg font-semibold mx-auto px-3 py-2.5 min-w-62.5 cursor-pointer"
  >
    {{ buttonText }}
  </button>
</template>
