import { computed, onMounted } from 'vue'

import { useFloodPointsStore } from '../stores/FloodPoints'

export function useFloodPointsMap() {
  const store = useFloodPointsStore()

  onMounted(async () => {
    if (!store.lastFetchedAt) {
      await store.load()
    }
  })

  return {
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    hasActiveFloods: computed(() => store.hasActiveFloods),
    tablePoints: computed(() => store.tablePoints),
    activePoints: computed(() => store.activeItemsUi),
    selectedFlood: computed(() => store.selectedFlood),
    activeGeoJson: computed(() => store.activeGeoJson),
    load: store.load,
    refresh: store.refresh,
    selectFlood: store.selectFlood,
    clearSelectedFlood: store.clearSelectedFlood,
  }
}
