<script setup lang="ts">
defineProps<{
  buttonText: string
  isDelete?: boolean
}>()
</script>

<template>
  <button
    :class="[
      'rounded-full text-white text-lg font-semibold mx-auto px-3 py-2.5 min-w-62.5 cursor-pointer',
      isDelete ? 'bg-[#FF0606] hover:bg-[#FF0606]/90' : 'bg-[#2966C1] hover:bg-[#2966C1]/90',
    ]"
  >
    {{ buttonText }}
  </button>
</template>
