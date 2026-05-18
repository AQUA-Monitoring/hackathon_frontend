import type { CameraApiItem, ICamera } from '@/types/camera'
import type { CameraWithPrediction, PredictionApiItem, PredictionData } from '@/types/predictions'

export const DEFAULT_ALLOWED_STATUSES = ['ACTIVE', 'OFFLINE'] as const

export function mapCamera(apiItem: CameraApiItem): ICamera {
  return {
    id: apiItem.id,
    name: apiItem.description ?? 'Câmera',
    hls_url: apiItem.video_hls ?? '',
    embed_url: apiItem.video_embed ?? undefined,
    flood_percentage: 0,
    status: apiItem.status,
    link: '/cameras',
    latitude: Number.isFinite(apiItem.latitude) ? apiItem.latitude : 0,
    longitude: Number.isFinite(apiItem.longitude) ? apiItem.longitude : 0,
  }
}

export function mapPrediction(item: PredictionApiItem): PredictionData {
  return {
    is_flooded: item.is_flooded ?? false,
    confidence: item.confidence ?? 0,
    probabilities: {
      normal: item.probabilities?.normal ?? 0,
      flooded: item.probabilities?.flooded ?? 0,
      medium: item.probabilities?.medium,
    },
  }
}

export function getFloodPercent(prediction?: PredictionData): number {
  if (!prediction) return 0
  const v = prediction.probabilities?.flooded
  if (typeof v !== 'number' || Number.isNaN(v)) return 0
  return Math.min(100, Math.max(0, v))
}

export function mergeCamerasWithPredictions(
  cameras: CameraApiItem[],
  predictions: PredictionApiItem[],
  options?: { allowedStatuses?: readonly string[] },
): CameraWithPrediction[] {
  const allowedStatuses = options?.allowedStatuses ?? DEFAULT_ALLOWED_STATUSES
  const allowedSet = new Set(allowedStatuses)

  const predictionsMap = new Map<string, PredictionApiItem>()
  for (const item of predictions) {
    const camId = item?.camera?.id
    if (!camId) continue
    predictionsMap.set(camId, item)
  }

  const merged = cameras
    .filter((c) => allowedSet.has(c.status))
    .map((c) => {
      const base = mapCamera(c)
      const predItem = predictionsMap.get(c.id)
      const prediction = predItem ? mapPrediction(predItem) : undefined
      return {
        ...base,
        prediction,
        predictionStatus: predItem?.status,
        flood_percentage: prediction ? getFloodPercent(prediction) : base.flood_percentage,
      }
    })

  return merged.sort((a, b) => {
    const aPct = getFloodPercent(a.prediction)
    const bPct = getFloodPercent(b.prediction)
    if (aPct !== bPct) return bPct - aPct
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}
