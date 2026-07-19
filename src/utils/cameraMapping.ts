import type { CameraApiItem, ICamera } from '@/types/camera/camera'
import type { CameraWithPrediction, PredictionApiItem, PredictionData } from '@/types/predictions'

export const DEFAULT_ALLOWED_STATUSES = ['ACTIVE', 'OFFLINE'] as const

export function mapCamera(apiItem: CameraApiItem): ICamera {
  const analysis = apiItem.operational.analysis
  const probabilities =
    analysis.status === 'AVAILABLE' || analysis.status === 'STALE' ? analysis.probabilities : null
  return {
    id: apiItem.id,
    name: apiItem.description ?? 'Câmera',
    hls_url: apiItem.video_hls ?? '',
    embed_url: apiItem.video_embed ?? undefined,
    flood_percentage: probabilities?.flooded ?? null,
    status: apiItem.administrative_status,
    link: '/cameras',
    latitude: apiItem.address?.latitude ?? apiItem.latitude ?? null,
    longitude: apiItem.address?.longitude ?? apiItem.longitude ?? null,
  }
}

export function mapPrediction(item: PredictionApiItem): PredictionData {
  return {
    is_flooded: item.is_flooded,
    confidence: item.confidence,
    probabilities: {
      normal: item.probabilities?.normal ?? null,
      flooded: item.probabilities?.flooded ?? null,
      medium: item.probabilities?.medium,
    },
  }
}

export function getFloodPercent(prediction?: PredictionData): number | null {
  if (!prediction) return null
  const v = prediction.probabilities.flooded
  if (typeof v !== 'number' || Number.isNaN(v)) return null
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
      const snapshot = c.operational.analysis
      const prediction = predItem
        ? mapPrediction(predItem)
        : (snapshot.status === 'AVAILABLE' || snapshot.status === 'STALE') && snapshot.probabilities
          ? {
            is_flooded: snapshot.classification === 'FLOOD_INDICATION',
            confidence: snapshot.confidence,
            probabilities: snapshot.probabilities,
          }
          : undefined
      return {
        ...base,
        prediction,
        predictionStatus: predItem?.status,
        flood_percentage: prediction ? getFloodPercent(prediction) : null,
      }
    })

  return merged.sort((a, b) => {
    const aPct = getFloodPercent(a.prediction) ?? -1
    const bPct = getFloodPercent(b.prediction) ?? -1
    if (aPct !== bPct) return bPct - aPct
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}
