export type FloodDemoState = 'auto' | 'normal' | 'flooded' | string
export type FloodDemoStatus = 'disabled' | 'starting' | 'ready' | 'unavailable' | 'error'

export interface FloodDemoSegment {
  sequence: number
  phase: string
  expected_state: string
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
  }
  validation: {
    expected: string
    actual: string
    match: boolean | null
  }
  model: {
    ready: boolean
    fallback: boolean
    version: string | null
  }
}
