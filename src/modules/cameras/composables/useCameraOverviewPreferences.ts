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

  const density = computed<'comfortable' | 'compact'>(() => 'comfortable')
  const cameraGridStyle = computed(() => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${cardMinWidth.value}px), 1fr))`,
  }))

  function setCardMinWidth(value: number, automatic = false) {
    const allowedWidths = [320, 360, 400]
    cardMinWidth.value = allowedWidths.reduce((closest, candidate) =>
      Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest,
    )
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
      setCardMinWidth(legacyGrid === 'compact' ? 320 : 360, false)
      const query = { ...route.query }
      delete query.grid
      void router.replace({ query })
    } else if (Number.isFinite(storedWidth) && storedWidth >= 320 && storedWidth <= 400) {
      const storedAutomatic = localStorage.getItem('aqua.cameraGridAutomatic') !== 'false'
      setCardMinWidth(storedAutomatic ? 320 : storedWidth, storedAutomatic)
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
