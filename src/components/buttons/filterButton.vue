<template>
  <div class="relative inline-block mr-2.5">
    <button
      @click="open = !open"
      class="border-2 border-[#7AA6C8] border-solid py-1 px-3 md:py-3 md:px-8 rounded-4xl md:rounded-4xl"
    >
      {{ title }}
      <span class="material-symbols-outlined align-middle ml-2" v-if="!open"
        >keyboard_arrow_down</span
      >
      <span class="material-symbols-outlined align-middle ml-2" v-else>keyboard_arrow_up</span>
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
