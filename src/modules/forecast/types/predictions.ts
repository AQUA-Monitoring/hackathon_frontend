import type { ICamera } from '@/modules/cameras'

export interface PredictionData {
  is_flooded: boolean | null
  confidence: number | null
  probabilities: {
    normal: number | null
    flooded: number | null
    medium?: number
  }
}

export interface PredictionApiItem {
  camera: {
    id: string
    description?: string
    video_hls?: string
  }
  status: string
  is_flooded: boolean | null
  medium?: boolean
  confidence: number | null
  probabilities: {
    normal: number | null
    flooded: number | null
    medium?: number
  } | null
}

export interface CameraWithPrediction extends ICamera {
  prediction?: PredictionData
  predictionStatus?: string
}
