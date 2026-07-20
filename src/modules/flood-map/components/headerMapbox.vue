<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNeighborhood } from '@/composables/neighborhood'
import LayersFilters from './layersFilters.vue'

const { loadNeighborhoods, neighborhoods } = useNeighborhood()
const openFilters = ref<boolean>(false)

onMounted(async () => {
  await loadNeighborhoods()
})
</script>

<template>
  <div class="absolute top-5 left-1/2 -translate-x-1/2 w-[90%] flex items-start justify-between">
    <div>
      <div class="relative w-55 bg-white dark:bg-[#001C3B] rounded-full pl-8 pr-5 py-1">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 text-gray-400"
        >
          <span class="material-symbols-outlined">location_on</span>
        </div>

        <select class="block w-full appearance-none rounded-full px-3 py-2 outline-none text-sm">
          <option
            v-for="(option, index) in neighborhoods?.features"
            :key="index"
            :value="index"
            class="w-40 text-[14px] text-black"
          >
            {{ option.properties.name }} - {{ option.properties.city }}
          </option>
        </select>

        <div
          class="pointer-events-none absolute inset-y-0 -right-2 flex items-center px-4 text-gray-400"
        >
          <span class="material-symbols-outlined">keyboard_arrow_down</span>
        </div>
      </div>

      <span class="relative top-3 bg-[#6326CC] text-white font-semibold px-7 py-1 rounded-full"
        >CRISE</span
      >
    </div>

    <button
      @click="openFilters = !openFilters"
      class="relative text-[#999999] bg-white dark:bg-[#001C3B] rounded-full p-3 material-symbols-outlined"
    >
      tune
    </button>
  </div>

  <TransitionGroup name="fab" v-if="openFilters">
    <LayersFilters />
  </TransitionGroup>
</template>

<style scoped>
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

.fab-enter-to,
.fab-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>
