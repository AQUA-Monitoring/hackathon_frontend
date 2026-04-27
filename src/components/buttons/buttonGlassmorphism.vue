<script setup lang="ts">
defineProps<{
  buttonText: string
}>()
</script>

<template>
  <button
    class="mx-auto mt-10 block w-62.5 cursor-pointer rounded-2xl border border-transparent bg-[#7AA6C8]/30 p-2 font-semibold shadow-xl backdrop-blur-xs hover:border-[#2768CA] dark:hover:border-[#FFFFFF]"
  >
    {{ buttonText }}
  </button>
</template>
