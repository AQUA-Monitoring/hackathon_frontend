<script setup lang="ts">
defineProps<{
  title: string
  options: string[]
}>()
</script>

<template>
  <div
    class="relative bg-white dark:bg-[#001C3B] rounded-full pl-1 pr-5 py-2 border-2 border-[#7AA6C8]"
  >
    <select class="block w-full appearance-none rounded-full px-3 outline-none text-sm">
      <option
        v-for="(option, index) in options"
        :key="index"
        :value="index"
        class="w-40 text-[14px] text-black"
      >
        {{ option }}
      </option>
    </select>

    <div
      class="pointer-events-none absolute inset-y-0 -right-2 flex items-center px-4 text-gray-400"
    >
      <span class="material-symbols-outlined">keyboard_arrow_down</span>
    </div>
  </div>
</template>
