export interface FloodPredictionsResponse {
    results: FloodPredictionItem[]
}

export interface PredictionCamera {
    id: string
    description: string
    video_embed: string
    video_hls: string
    status: string
    neighborhood?: string | null
}

export interface PredictionData {
    is_flooded: boolean
    confidence: number
    probabilities: {
        normal: number
        flooded: number
    }
}

export interface PredictionMetrics {
    frames_captured: number
    best_flooded: number
    mean_flooded: number
    mean_normal: number
    threshold: number
}

export interface FloodPredictionItem {
    camera: PredictionCamera
    prediction: PredictionData
    metrics?: PredictionMetrics
    status: string
    error?: string | null
}

export interface CameraPredictionUI {
    id: string
    name: string
    url: string
    isFlooded: boolean
    confidence: number
    probabilities: PredictionData['probabilities']
    status: string
}

// ————————————————————————————————————————————————
// Formatos unificados com as câmeras
// Enriquecemos a câmera com os dados de predição (quando existir)
import type { ICamera } from './camera'

export interface CameraWithPrediction extends ICamera {
    prediction?: PredictionData
    predictionStatus?: string
}

export interface UnifiedCamerasResponse {
    cameras: CameraWithPrediction[]
}

// ————————————————————————————————————————————————
// Retorno combinado das predições (cru + mapeado para UI)
export interface FloodPredictionsAllResponse {
    raw: FloodPredictionsResponse
    ui: CameraPredictionUI[]
}
