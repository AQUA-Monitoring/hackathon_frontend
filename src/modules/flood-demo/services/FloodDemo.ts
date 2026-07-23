import api from '@/app/plugins/axios'
import type {
  FloodDemoPrediction,
  FloodDemoPredictionBatch,
  FloodDemoPredictionBatchRequest,
  FloodDemoSourcesResponse,
  FloodDemoSourceSlot,
  FloodDemoState,
  FloodDemoStream,
} from '../floodDemo'

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

function resolveDemoApiUrl(value: string): URL | null {
  try {
    const apiBase = new URL(
      String(import.meta.env.VITE_BASE_URL || '/api/'),
      window.location.origin,
    )
    const resolved = new URL(value, apiBase)
    if (!['https:', 'http:'].includes(resolved.protocol) || resolved.origin !== apiBase.origin) {
      return null
    }
    return resolved
  } catch {
    return null
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
      return {
        enabled: data.enabled,
        status: data.status,
        session_id: data.session_id ?? null,
        demo_state: data.demo_state ?? 'auto',
        available_states: data.available_states ?? [],
        current_phase: data.current_phase ?? null,
        hls_url: normalizeDemoHlsUrl(data.hls_url),
        segment: data.segment ?? null,
        source: data.source ?? null,
      }
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

  async getPrediction(
    sequence: number,
    signal?: AbortSignal,
  ): Promise<FloodDemoPrediction> {
    const { data } = await api.get<FloodDemoPrediction | LegacyFloodDemoPrediction>(
      '/flood_monitoring/demo/predict',
      { signal, params: { sequence } },
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

  async getPredictionBatch(
    request: FloodDemoPredictionBatchRequest,
    signal?: AbortSignal,
  ): Promise<FloodDemoPredictionBatch> {
    const { data } = await api.post<FloodDemoPredictionBatch>(
      '/flood_monitoring/demo/predictions/batch',
      request,
      { signal },
    )
    return data
  }

  async getRepresentativeImage(url: string, signal?: AbortSignal): Promise<Blob> {
    const resolvedUrl = resolveDemoApiUrl(url)
    if (!resolvedUrl) throw new Error('Representative image URL is not allowed')
    const response = await fetch(resolvedUrl, {
      method: 'GET',
      signal,
      credentials: 'omit',
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Representative image returned ${response.status}`)
    const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim()
    if (contentType !== 'image/jpeg') throw new Error('Representative image is not a JPEG')
    const blob = await response.blob()
    if (blob.type !== 'image/jpeg') throw new Error('Representative image blob is not a JPEG')
    return blob
  }

  isRepresentativeImageUrlAllowed(url: string): boolean {
    return resolveDemoApiUrl(url) !== null
  }

  async setState(state: FloodDemoState): Promise<FloodDemoStream> {
    const { data } = await api.post<FloodDemoStream>('/flood_monitoring/demo/state', { state })
    return { ...data, hls_url: normalizeDemoHlsUrl(data.hls_url) }
  }

  async getSources(signal?: AbortSignal): Promise<FloodDemoSourceSlot[]> {
    const { data } = await api.get<FloodDemoSourcesResponse>('/flood_monitoring/demo/sources', {
      signal,
    })
    return data.results
  }

  async uploadSource(
    mode: FloodDemoState,
    file: File,
    onProgress: (progress: number | null) => void,
  ): Promise<FloodDemoSourceSlot> {
    const body = new FormData()
    body.append('file', file)
    const { data } = await api.put<FloodDemoSourceSlot>(
      `/flood_monitoring/demo/sources/${mode}`,
      body,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress(event) {
          onProgress(event.total ? Math.round((event.loaded / event.total) * 100) : null)
        },
      },
    )
    return data
  }
}
