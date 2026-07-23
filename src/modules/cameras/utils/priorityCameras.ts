import type { CameraApiItem, CameraClassification } from '../types/camera'

export type PriorityCamera = CameraApiItem & {
  operational: CameraApiItem['operational'] & {
    analysis: CameraApiItem['operational']['analysis'] & {
      status: 'AVAILABLE'
      classification: CameraClassification
      analyzed_at: string
      probabilities: NonNullable<CameraApiItem['operational']['analysis']['probabilities']>
    }
  }
}

const priorityClassifications = new Set<CameraClassification>([
  'NO_INDICATION',
  'INTERMEDIATE_INDICATION',
  'FLOOD_INDICATION',
])

export function isPriorityCamera(camera: CameraApiItem): camera is PriorityCamera {
  const analysis = camera.operational.analysis
  const flooded = analysis.probabilities?.flooded
  return (
    camera.status === 'ACTIVE' &&
    camera.administrative_status === 'ACTIVE' &&
    camera.operational.stream.status === 'ONLINE' &&
    analysis.status === 'AVAILABLE' &&
    analysis.classification !== null &&
    priorityClassifications.has(analysis.classification) &&
    typeof analysis.analyzed_at === 'string' &&
    !Number.isNaN(Date.parse(analysis.analyzed_at)) &&
    typeof flooded === 'number' &&
    Number.isFinite(flooded) &&
    flooded >= 0 &&
    flooded <= 100
  )
}

export function rankPriorityCameras(cameras: CameraApiItem[]): PriorityCamera[] {
  return cameras.filter(isPriorityCamera).sort((a, b) => {
    const probability =
      b.operational.analysis.probabilities.flooded -
      a.operational.analysis.probabilities.flooded
    if (probability !== 0) return probability
    const analyzedAt =
      Date.parse(b.operational.analysis.analyzed_at) -
      Date.parse(a.operational.analysis.analyzed_at)
    if (analyzedAt !== 0) return analyzedAt
    return a.description.localeCompare(b.description, 'pt-BR') || a.id.localeCompare(b.id)
  })
}

export function orderHomeCameraCatalog(cameras: CameraApiItem[]): CameraApiItem[] {
  const active = cameras.filter(
    (camera) =>
      camera.administrative_status === 'ACTIVE' && camera.status !== 'INACTIVE',
  )
  const priorities = rankPriorityCameras(active)
  const priorityIds = new Set(priorities.map((camera) => camera.id))
  const remaining = active
    .filter((camera) => !priorityIds.has(camera.id))
    .sort(
      (a, b) =>
        a.description.localeCompare(b.description, 'pt-BR') || a.id.localeCompare(b.id),
    )
  return [...priorities, ...remaining]
}
