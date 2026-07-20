import { computed, type Ref } from 'vue'
import type { CameraApiItem, NeighborhoodDto } from '../types/camera'
import { cameraPresentation } from '../utils/cameraPresentation'
import { formatTerritoryLabel } from '@/utils/territoryPresentation'

function classificationProbability(camera: CameraApiItem) {
  const analysis = camera.operational.analysis
  const probabilities = analysis.probabilities
  if (!analysis.classification || !probabilities) return -1
  if (analysis.classification === 'FLOOD_INDICATION') return probabilities.flooded
  if (analysis.classification === 'INTERMEDIATE_INDICATION') return probabilities.medium
  return probabilities.normal
}

export function useCameraOverviewCatalog(
  cameras: Ref<CameraApiItem[]>,
  neighborhoods: Ref<NeighborhoodDto[]>,
  showOffline: Ref<boolean>,
) {
  const offlineCount = computed(
    () => cameras.value.filter((camera) => camera.operational.stream.status === 'UNAVAILABLE').length,
  )
  const sortedCameras = computed(() => {
    const ranked = [...cameras.value].sort((left, right) => {
      const rankDiff = cameraPresentation(left).rank - cameraPresentation(right).rank
      if (rankDiff) return rankDiff
      const probabilityDiff = classificationProbability(right) - classificationProbability(left)
      if (probabilityDiff) return probabilityDiff
      return left.description.localeCompare(right.description, 'pt-BR')
    })
    const available = ranked.filter((camera) => camera.operational.stream.status !== 'UNAVAILABLE')
    if (!showOffline.value) return available
    const offline = ranked.filter((camera) => camera.operational.stream.status === 'UNAVAILABLE')
    return [...available, ...offline]
  })

  function territoryOptions(kind: 'region' | 'neighborhood') {
    const entries = new Map<string, string>()
    for (const neighborhood of neighborhoods.value) {
      const territory = kind === 'region' ? neighborhood.region : neighborhood
      if (territory) entries.set(territory.id, formatTerritoryLabel(territory.name))
    }
    for (const camera of cameras.value) {
      const territory =
        kind === 'region'
          ? (camera.address?.region ?? camera.region)
          : (camera.address?.neighborhood ?? camera.neighborhood)
      if (territory) entries.set(territory.id, formatTerritoryLabel(territory.name))
    }
    return [...entries]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  return {
    offlineCount,
    sortedCameras,
    regionOptions: computed(() => territoryOptions('region')),
    neighborhoodOptions: computed(() => territoryOptions('neighborhood')),
  }
}
