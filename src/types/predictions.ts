import type { ICamera } from './camera'

export interface PredictionData {
  is_flooded: boolean
  confidence: number
  probabilities: {
    normal: number
    flooded: number
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
  is_flooded: boolean
  medium?: boolean
  confidence: number
  probabilities: {
    normal: number
    flooded: number
    medium?: number
  }
}

export interface CameraWithPrediction extends ICamera {
  prediction?: PredictionData
  predictionStatus?: string
}
