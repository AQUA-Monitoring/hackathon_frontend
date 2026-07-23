<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFloodCameraMonitoringStore } from '@/modules/cameras'

const ctrl = useFloodCameraMonitoringStore()
const filters: string[] = ['Visão Geral', 'Especialista', 'IA']

const selected = ref<string>('Visão Geral')
const { showCameras } = storeToRefs(ctrl)

const toggleSelected = (filter: string) => {
  selected.value = filter
}
</script>

<template>
  <div
    class="absolute md:right-2 top-20 md:top-auto right-5 md:bottom-5 rounded-2xl bg-white p-5 text-center dark:bg-[#001C3B] overflow-hidden transition-all duration-300 py-5"
  >
    <h3 class="text-lg font-semibold">Camadas</h3>

    <ul class="grid gap-2 my-3">
      <li v-for="(filter, index) in filters" :key="index">
        <button
          :class="[
            'cursor-pointer text-sm border border-[#2768CA] rounded-full py-1 w-full',
            selected == filter ? 'bg-[#2768CA] text-white' : '',
          ]"
          @click="toggleSelected(filter)"
        >
          {{ filter }}
        </button>
      </li>
    </ul>

    <label class="flex cursor-pointer items-center gap-2 text-sm">
      <input v-model="showCameras" type="checkbox" aria-label="Exibir câmeras" />
      Exibir câmeras
    </label>
  </div>
</template>
