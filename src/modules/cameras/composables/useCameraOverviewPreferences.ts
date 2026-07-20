import { computed, onMounted, ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

function queryText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function useCameraOverviewPreferences(route: RouteLocationNormalizedLoaded, router: Router) {
  const cardMinWidth = ref(320)
  const automaticGrid = ref(true)
  const previewsPaused = ref(false)
  let legacyGridMigrated = false

  const density = computed<'comfortable' | 'compact'>(() =>
    cardMinWidth.value <= 280 ? 'compact' : 'comfortable',
  )
  const cameraGridStyle = computed(() => ({
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${cardMinWidth.value}px), 1fr))`,
  }))

  function setCardMinWidth(value: number, automatic = false) {
    cardMinWidth.value = Math.min(400, Math.max(240, Math.round(value / 40) * 40))
    automaticGrid.value = automatic
    localStorage.setItem('aqua.cameraCardMinWidth', String(cardMinWidth.value))
    localStorage.setItem('aqua.cameraGridAutomatic', String(automatic))
  }

  function setPreviewsPaused(value: boolean) {
    previewsPaused.value = value
    localStorage.setItem('aqua.cameraPreviewsPaused', String(value))
  }

  onMounted(() => {
    const storedWidth = Number(localStorage.getItem('aqua.cameraCardMinWidth'))
    const legacyGrid = queryText(route.query.grid)
    if (legacyGrid && !legacyGridMigrated) {
      legacyGridMigrated = true
      setCardMinWidth(legacyGrid === 'compact' ? 280 : 360, false)
      const query = { ...route.query }
      delete query.grid
      void router.replace({ query })
    } else if (Number.isFinite(storedWidth) && storedWidth >= 240 && storedWidth <= 400) {
      cardMinWidth.value = storedWidth
      automaticGrid.value = localStorage.getItem('aqua.cameraGridAutomatic') !== 'false'
    }
    const saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    )
    previewsPaused.value =
      localStorage.getItem('aqua.cameraPreviewsPaused') === 'true' ||
      (localStorage.getItem('aqua.cameraPreviewsPaused') === null && saveData)
  })

  return {
    cardMinWidth,
    automaticGrid,
    previewsPaused,
    density,
    cameraGridStyle,
    setCardMinWidth,
    setPreviewsPaused,
  }
}
