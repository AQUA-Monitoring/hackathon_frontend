<script setup lang="ts">
defineProps<{
  buttonText: string
  isDelete?: boolean
  isAuth?: boolean
}>()
</script>

<template>
  <button
    :class="[
      'rounded-full text-lg font-semibold mx-auto px-3 py-2.5 min-w-62.5 cursor-pointer',
      isDelete ? 'bg-[#FF0606] hover:bg-[#FF0606]/90' : 'bg-[#2966C1] hover:bg-[#2966C1]/90',
      isAuth ? 'bg-transparent shadow-[0_8px_25px_rgba(0,0,0,0.40)]' : 'text-white',
    ]"
  >
    {{ buttonText }}
  </button>
</template>
