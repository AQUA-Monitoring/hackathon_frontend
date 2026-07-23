import api from '@/app/plugins/axios'
import type { FloodDemoPrediction, FloodDemoState, FloodDemoStream } from '../types/floodDemo'

interface LegacyFloodDemoStream {
  ok?: boolean
  hls_url?: string
}

interface LegacyFloodDemoPrediction {
  is_flooded?: boolean
  confidence?: number
  normal?: number
  probabilities?: Record<string, number>
  meta?: {
    model_fallback?: boolean
    checkpoint?: string
  }
}

function isCurrentStream(data: FloodDemoStream | LegacyFloodDemoStream): data is FloodDemoStream {
  return 'enabled' in data && 'status' in data
}

function isCurrentPrediction(
  data: FloodDemoPrediction | LegacyFloodDemoPrediction,
): data is FloodDemoPrediction {
  return 'prediction' in data && 'validation' in data
}

function getPredictedState(probabilities: Record<string, number>) {
  return Object.entries(probabilities).reduce(
    (highest, [state, value]) => (value > highest.value ? { state, value } : highest),
    { state: 'normal', value: 0 },
  ).state
}

export default class FloodDemoApi {
  async getStream(): Promise<FloodDemoStream> {
    const { data } = await api.get<FloodDemoStream | LegacyFloodDemoStream>(
      '/flood_monitoring/demo',
    )

    if (isCurrentStream(data)) return data

    return {
      enabled: data.ok !== false && !!data.hls_url,
      status: data.hls_url ? 'ready' : 'unavailable',
      session_id: data.hls_url ? 'legacy' : null,
      demo_state: 'auto',
      available_states: [],
      current_phase: null,
      hls_url: data.hls_url ?? null,
      segment: null,
    }
  }

  async getPrediction(): Promise<FloodDemoPrediction> {
    const { data } = await api.get<FloodDemoPrediction | LegacyFloodDemoPrediction>(
      '/flood_monitoring/demo/predict',
    )

    if (isCurrentPrediction(data)) return data

    const probabilities = data.probabilities ?? { normal: data.normal ?? 0 }
    const state = getPredictedState(probabilities)

    return {
      session_id: 'legacy',
      demo_state: 'auto',
      segment: {
        sequence: 0,
        phase: 'Dados de demonstração',
        expected_state: 'unknown',
      },
      prediction: {
        state,
        confidence: data.confidence ?? probabilities[state] ?? 0,
        probabilities,
        frames: 0,
      },
      validation: {
        expected: 'unknown',
        actual: state,
        match: null,
      },
      model: {
        ready: true,
        fallback: data.meta?.model_fallback ?? false,
        version: data.meta?.checkpoint ?? 'legacy',
      },
    }
  }

  async setState(state: FloodDemoState): Promise<void> {
    await api.post('/flood_monitoring/demo/state', { state })
  }
}
