<script setup lang="ts">
import { ref } from 'vue'
import { useScreenSize } from '@/composables/screenSize'

defineProps<{ title?: string }>()
const { isMobile } = useScreenSize()

interface Menu {
  icon: string
  label: string
  link?: string
  options?: {
    label: string
    icon: string
    link: string
  }[]
}

const menubar: Menu[] = [
  {
    label: 'Menu',
    icon: 'add',
    options: [
      { label: '', icon: 'docs', link: '/' },
      { label: '', icon: 'camera_outdoor', link: '/' },
      { label: '', icon: 'savings', link: '/' },
      { label: '', icon: 'contact_support', link: '/' },
    ],
  },
  { label: 'Início', icon: 'home', link: '/' },
  { label: 'Perfil', icon: 'person', link: '/' },
]

const openMenuId = ref<number | null>(null)
const toggleMenu = (id: number) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const getSemiCircleStyle = (index: number, total: number) => {
  const angle = 90 + ((150 - 90) / (total - 1)) * index //90 = startAngle; 150 = endAngle
  const rad = (angle * Math.PI) / 180
  const x = Math.cos(rad) * 170 // 170 = raio
  const y = Math.sin(rad) * 170

  return {
    right: `${30 + x}px`,
    bottom: `${y}px`,
  }
}
</script>

<template>
  <transition name="overlay">
    <div
      v-if="openMenuId !== null"
      class="fixed inset-0 z-40 bg-white/60 backdrop-blur-[2px]"
      @click="openMenuId = null"
    />
  </transition>

  <nav
    v-if="isMobile"
    class="absolute bottom-2 z-50 left-1/2 -translate-x-1/2 w-[90%] max-w-sm rounded-full bg-white py-5 text-[#999999] shadow-xl dark:bg-[#001C3B]"
  >
    <ul class="flex items-center justify-around">
      <li v-for="(item, index) in menubar" :key="index">
        <RouterLink
          v-if="!item.options && item.link"
          :to="item.link"
          :class="[item.label == title ? 'text-[#2768CA]' : '', 'active:text-[#2768CA]']"
        >
          <p class="flex flex-col items-center">
            <span class="material-symbols-outlined">
              {{ item.icon }}
            </span>
            {{ item.label }}
          </p>
        </RouterLink>

        <div v-else class="relative">
          <button
            @click="toggleMenu(index)"
            :aria-expanded="openMenuId === index"
            class="active:text-[#2768CA]"
          >
            <p class="flex flex-col items-center">
              <span class="material-symbols-outlined">
                {{ item.icon }}
              </span>
              {{ item.label }}
            </p>
          </button>

          <TransitionGroup name="fab" v-if="item.options">
            <RouterLink
              v-for="(option, optionIndex) in item.options"
              v-show="openMenuId === index"
              :key="option.icon"
              :to="option.link"
              class="absolute flex h-14 w-14 items-center justify-center rounded-full bg-[#2768CA] text-white shadow-xl active:bg-[#7AA6C8]"
              :style="getSemiCircleStyle(optionIndex, item.options.length)"
            >
              <span class="material-symbols-outlined">
                {{ option.icon }}
              </span>
            </RouterLink>
          </TransitionGroup>
        </div>
      </li>
    </ul>
  </nav>
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

/* overlay */

.overlay-enter-active,
.overlay-leave-active {
  transition: all 0.25s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.overlay-enter-to,
.overlay-leave-from {
  opacity: 1;
  backdrop-filter: blur(2px);
}
</style>
