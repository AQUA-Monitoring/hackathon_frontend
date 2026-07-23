<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFloodCameraMonitoringStore } from '@/modules/cameras/stores/FloodCameraMonitoring'

const ctrl = useFloodCameraMonitoringStore()
const filters: string[] = ['Visão Geral', 'Especialista', 'IA']

const isOpen = ref<boolean>(false)
const selected = ref<string>('Visão Geral')
const { showCameras } = storeToRefs(ctrl)

const toggleSelected = (filter: string) => {
  selected.value = filter
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div
    :class="[
      'absolute md:right-2 top-20 md:top-auto right-5 md:bottom-5 rounded-2xl bg-white p-5 text-center dark:bg-[#001C3B] overflow-hidden transition-all duration-300',
      !isOpen ? 'py-3' : 'py-5',
    ]"
  >
    <button class="flex items-center justify-between w-full cursor-pointer" @click="toggleMenu">
      <h3 class="text-lg font-semibold">Camadas</h3>
      <span
        :class="[
          'material-symbols-outlined transition-all duration-300',
          isOpen ? 'rotate-180' : 'rotate-0',
        ]"
        >keyboard_arrow_down</span
      >
    </button>

    <Transition name="collapse">
      <div v-if="isOpen">
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

        <label class="flex items-center gap-2 text-sm cursor-pointer"
          ><input type="checkbox" v-model="showCameras" />Ocultar câmeras</label
        >
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
  transform-origin: top center;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
