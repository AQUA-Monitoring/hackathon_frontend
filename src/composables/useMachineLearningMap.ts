import { computed, onMounted } from 'vue'
import { useMachineLearningStore } from '@/stores/MachineLearning'

export function useMachineLearningMap() {
  const store = useMachineLearningStore()

  onMounted(async () => {
    if (!store.lastFetchedAt) {
      await store.load()
    }
  })

  return {
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    geoJson: computed(() => store.geoJson),
    load: store.load,
    refresh: store.refresh,
    lastFetchedAt: computed(() => store.lastFetchedAt),
  }
}
