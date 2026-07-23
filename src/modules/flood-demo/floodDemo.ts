export type FloodDemoStatus = 'disabled' | 'starting' | 'ready' | 'unavailable' | 'error'
export type FloodDemoState = 'auto' | 'normal' | 'flooded'
export type FloodDemoSourceStatus = 'processing' | 'ready' | 'error'

export const FLOOD_DEMO_STATES: readonly FloodDemoState[] = ['auto', 'normal', 'flooded']

export interface FloodDemoSegment {
  sequence: number
  phase: string
  expected_state: string | null
}

export interface FloodDemoSource {
  type: 'uploader' | string
  status: 'resolved' | 'unavailable' | string
  description?: string | null
}

export interface FloodDemoStream {
  enabled: boolean
  status: FloodDemoStatus
  session_id: string | null
  demo_state: FloodDemoState
  available_states: FloodDemoState[]
  current_phase: string | null
  hls_url: string | null
  segment: FloodDemoSegment | null
  source?: FloodDemoSource | null
}

export interface FloodDemoPrediction {
  session_id: string
  demo_state: FloodDemoState
  segment: FloodDemoSegment
  prediction: {
    state: string
    confidence: number | null
    probabilities: Record<string, number> | null
    frames: number | null
    samples?: FloodDemoPredictionSample[]
  }
  validation: {
    expected: string | null
    actual: string
    match: boolean | null
  }
  model: {
    ready: boolean
    fallback: boolean
    version: string | null
  }
}

export interface FloodDemoPredictionSample {
  index: number
  state: string
  confidence: number | null
  probabilities: {
    normal: number
    medium: number
    flooded: number
  }
}

export type FloodDemoBatchResultStatus = 'available' | 'missing' | 'gone' | 'error'
export type FloodDemoBatchResultSource = 'cache' | 'computed' | null

export interface FloodDemoRepresentativeImage {
  url: string
  content_type: 'image/jpeg'
  expires_at: string
  session_id: string
  sequence: number
  model_version: string
}

export interface FloodDemoPredictionBatchItem {
  sequence: number
  offset_segments: 2 | 1 | 0
  nominal_offset_seconds: number
  status: FloodDemoBatchResultStatus
  source: FloodDemoBatchResultSource
  prediction: FloodDemoPrediction | null
  error: {
    code: string
    detail: string
  } | null
  representative_image: FloodDemoRepresentativeImage | null
}

export interface FloodDemoPredictionBatch {
  schema_version: 4
  session_id: string
  anchor_sequence: number
  segment_duration_seconds: number
  model: FloodDemoPrediction['model']
  partial: boolean
  results: FloodDemoPredictionBatchItem[]
}

export interface FloodDemoPredictionBatchRequest {
  session_id: string
  anchor_sequence: number
  model_version?: string
}

export interface FloodDemoSourceSlot {
  mode: FloodDemoState
  description: string
  status: FloodDemoSourceStatus
  size_bytes: number | null
  uploaded_on: string | null
  active: boolean
  error: string | null
}

export interface FloodDemoSourcesResponse {
  results: FloodDemoSourceSlot[]
}
