import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()

export const isMobile = computed(() => width.value < 768)
export const isTablet = computed(() => width.value >= 768 && width.value < 1024)
export const isDesktop = computed(() => width.value >= 1024)
