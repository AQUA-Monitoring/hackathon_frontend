import api from '@/plugins/axios'

interface DemoResponse {
  ok: boolean
  hls_url: string
}

export default class FloodDemoApi {
  private _getPromise: Promise<string> | null = null
  private _predictPromise: Promise<any> | null = null

  async get(): Promise<string> {
    if (this._getPromise) return this._getPromise

    this._getPromise = (async () => {
      const { data } = await api.get<DemoResponse>('/flood_monitoring/demo/')

      if (!data || typeof data.hls_url !== 'string') {
        throw new Error('Resposta inválida do demo (hls_url ausente)')
      }

      const raw = data.hls_url || ''

      const hlsTarget = import.meta.env?.VITE_HLS_TARGET as string | undefined
      const targetHost = hlsTarget ? hlsTarget.replace(/^https?:\/\//i, '') : '192.168.7.10:8000'

      const ipPattern =
        /^(https?:\/\/)(?:localhost:\d+|127\.0\.0\.1:\d+|10\.\d+\.\d+\.\d+:\d+|192\.168\.\d+\.\d+:\d+|\[::1\]:\d+|[a-zA-Z0-9.-]+:\d+)/

      // já proxied
      if (raw.startsWith('/hls/')) return raw

      try {
        const url = new URL(raw)

        if (url.host === targetHost || ipPattern.test(raw)) {
          return `/hls${url.pathname}${url.search}${url.hash}`
        }
      } catch {
        // não é URL absoluta → mantém
      }

      return raw
    })()

    try {
      return await this._getPromise
    } finally {
      this._getPromise = null
    }
  }

  async predictDemo(): Promise<any> {
    if (this._predictPromise) return this._predictPromise

    this._predictPromise = (async () => {
      const { data } = await api.get('/flood_monitoring/demo/predict/')

      if (!data) {
        throw new Error('Resposta vazia do endpoint de predição do demo')
      }

      return data
    })()

    try {
      return await this._predictPromise
    } finally {
      this._predictPromise = null
    }
  }
}
