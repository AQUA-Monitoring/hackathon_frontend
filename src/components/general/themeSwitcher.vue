<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button @click="toggleTheme">
    <span
      class="material-symbols-outlined cursor-pointer text-gray-500 transition-all duration-300 ease-out lg:text-black lg:dark:text-white"
      :class="[isDark ? 'scale-90 rotate-180 lg:scale-120' : 'scale-100 rotate-360 lg:scale-120']"
    >
      {{ isDark ? 'sunny' : 'bedtime' }}
    </span>
  </button>
</template>
