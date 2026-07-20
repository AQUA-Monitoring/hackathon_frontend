import { computed, type Ref } from 'vue'
import type { CameraApiItem, NeighborhoodDto } from '../types/camera'
import { cameraPresentation } from '../utils/cameraPresentation'
import { formatTerritoryLabel } from '@/shared'

function classificationProbability(camera: CameraApiItem) {
  if (camera.status !== 'ACTIVE' || camera.operational.stream.status !== 'ONLINE') return -1
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
) {
  const sortedCameras = computed(() => {
    return [...cameras.value].sort((left, right) => {
      const rankDiff = cameraPresentation(left).rank - cameraPresentation(right).rank
      if (rankDiff) return rankDiff
      const probabilityDiff = classificationProbability(right) - classificationProbability(left)
      if (probabilityDiff) return probabilityDiff
      return left.description.localeCompare(right.description, 'pt-BR')
    })
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
    sortedCameras,
    regionOptions: computed(() => territoryOptions('region')),
    neighborhoodOptions: computed(() => territoryOptions('neighborhood')),
  }
}
