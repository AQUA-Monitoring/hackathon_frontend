<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  options: string[]
}>()

const open = ref<boolean>(false)
</script>

<template>
  <div class="relative inline-block mr-2.5">
    <button
      @click="open = !open"
      class="border-2 border-[#7AA6C8] border-solid py-3 px-8 rounded-4xl"
    >
      {{ title }}
      <span v-if="!open" class="material-symbols-outlined align-middle ml-2"
        >keyboard_arrow_down</span
      >
      <span v-else class="material-symbols-outlined align-middle ml-2">keyboard_arrow_up</span>
    </button>

    <ul
      v-if="open"
      class="absolute left-0 top-16 w-45 rounded-2xl bg-white shadow-[0_0_8px_rgba(0,0,0,0.2)]"
    >
      <li v-for="item in options" :key="item" class="p-2.5 cursor-pointer hover:bg-gray-100">
        {{ item }}
      </li>
    </ul>
  </div>
</template>
