interface Probability {
    flooded: number
    medium?: number
    normal: number
}

interface Prediction {
    confidence: number
    is_flooded: boolean
    probabilities: Probability
}

export interface ICamera {
    embed_url?: string
    flood_percentage: number
    hls_url: string
    id: string
    latitude: number
    link: string
    longitude: number
    name: string
    prediction: Prediction
    status: string
}

export type ViewMode = 'embed' | 'hls'
