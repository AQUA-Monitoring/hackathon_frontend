import api from '@/plugins/axios'
import type { FloodDemoPrediction, FloodDemoState, FloodDemoStream } from '@/types/floodDemo'

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

function normalizeDemoHlsUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const streamUrl = new URL(value, window.location.origin)
    if (!streamUrl.pathname.startsWith('/hls/')) return value

    // Em desenvolvimento o Vite encaminha /hls ao demo-stream. Em uma página
    // HTTPS, a mesma origem evita mixed content e delega o TLS ao proxy público.
    if (
      import.meta.env.DEV ||
      (window.location.protocol === 'https:' && streamUrl.protocol === 'http:')
    ) {
      return `${streamUrl.pathname}${streamUrl.search}`
    }

    // Uma URL publicada como localhost só é válida quando API e navegador
    // estão na mesma máquina. Fora disso, use o host configurado para a API.
    if (['localhost', '127.0.0.1', '::1'].includes(streamUrl.hostname)) {
      const apiUrl = new URL(
        String(import.meta.env.VITE_BASE_URL || '/api/'),
        window.location.origin,
      )
      if (!['localhost', '127.0.0.1', '::1'].includes(apiUrl.hostname)) {
        streamUrl.hostname = apiUrl.hostname
        return streamUrl.toString()
      }
    }
    return value
  } catch {
    return value
  }
}

function getPredictedState(probabilities: Record<string, number> | null) {
  if (!probabilities || !Object.keys(probabilities).length) return 'unknown'
  return Object.entries(probabilities).reduce(
    (highest, [state, value]) => (value > highest.value ? { state, value } : highest),
    { state: 'normal', value: 0 },
  ).state
}

export default class FloodDemoApi {
  async getStream(signal?: AbortSignal): Promise<FloodDemoStream> {
    const { data } = await api.get<FloodDemoStream | LegacyFloodDemoStream>(
      '/flood_monitoring/demo',
      { signal },
    )

    if (isCurrentStream(data)) {
      return { ...data, hls_url: normalizeDemoHlsUrl(data.hls_url) }
    }

    return {
      enabled: data.ok !== false && !!data.hls_url,
      status: data.hls_url ? 'ready' : 'unavailable',
      session_id: data.hls_url ? 'legacy' : null,
      demo_state: 'auto',
      available_states: [],
      current_phase: null,
      hls_url: normalizeDemoHlsUrl(data.hls_url),
      segment: null,
    }
  }

  async getPrediction(signal?: AbortSignal): Promise<FloodDemoPrediction> {
    const { data } = await api.get<FloodDemoPrediction | LegacyFloodDemoPrediction>(
      '/flood_monitoring/demo/predict',
      { signal },
    )

    if (isCurrentPrediction(data)) return data

    const probabilities =
      data.probabilities ?? (typeof data.normal === 'number' ? { normal: data.normal } : null)
    const state = getPredictedState(probabilities)
    const fallback = data.meta?.model_fallback ?? false

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
        confidence:
          typeof data.confidence === 'number'
            ? data.confidence
            : probabilities && typeof probabilities[state] === 'number'
              ? probabilities[state]
              : null,
        probabilities,
        frames: null,
      },
      validation: {
        expected: 'unknown',
        actual: state,
        match: null,
      },
      model: {
        ready: !fallback && probabilities !== null,
        fallback,
        version: data.meta?.checkpoint ?? null,
      },
    }
  }

  async setState(state: FloodDemoState): Promise<void> {
    await api.post('/flood_monitoring/demo/state', { state })
  }
}
