import Hls from 'hls.js'
import { onBeforeUnmount, onMounted, ref, watch, toValue, type Ref } from 'vue'

export interface HlsOptions {
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  playsinline?: boolean
  poster?: string
  lockToLive?: boolean
  liveDelay?: number
  maxDelaySec?: number
}

export function useHlsStream(cfg: {
  src: string | Ref<string>
  options?: HlsOptions | Ref<HlsOptions>
}) {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const errorMessage = ref<string | null>(null)
  let hls: Hls | null = null
  let keepLiveTimer: number | null = null

  const defaults: Required<
    Pick<
      HlsOptions,
      'autoplay' | 'muted' | 'controls' | 'playsinline' | 'lockToLive' | 'liveDelay' | 'maxDelaySec'
    >
  > = {
    autoplay: true,
    muted: true,
    controls: true,
    playsinline: true,
    lockToLive: false,
    liveDelay: 1.5,
    maxDelaySec: 60,
  }

  function options(): Required<typeof defaults> & Partial<HlsOptions> {
    const raw = toValue(cfg.options ?? ({} as HlsOptions)) as HlsOptions
    return { ...defaults, ...raw }
  }

  function clearTimer() {
    if (keepLiveTimer !== null) {
      window.clearInterval(keepLiveTimer)
      keepLiveTimer = null
    }
  }

  function destroy() {
    if (hls) {
      try {
        hls.destroy()
      } catch {}
      hls = null
    }
    const v = videoRef.value
    if (v) {
      try {
        v.removeAttribute('src')
        v.load()
      } catch {}
    }
    clearTimer()
  }

  function getLiveEdge(video: HTMLVideoElement): number | null {
    try {
      const rng = video.seekable
      if (rng && rng.length > 0) return rng.end(rng.length - 1)
    } catch {}
    return null
  }

  function seekToLive(video: HTMLVideoElement) {
    const end = getLiveEdge(video)
    if (end == null) return
    const { liveDelay } = options()
    const target = Math.max(end - liveDelay, 0)
    if (Math.abs(video.currentTime - target) > 0.35) video.currentTime = target
  }

  function startKeepLive() {
    clearTimer()
    keepLiveTimer = window.setInterval(() => {
      const v = videoRef.value
      if (!v) return
      const end = getLiveEdge(v)
      if (end == null) return
      const { lockToLive, liveDelay, maxDelaySec } = options()
      const allowedMin = Math.max(end - maxDelaySec, 0)
      if (v.currentTime < allowedMin) {
        v.currentTime = allowedMin
        return
      }
      if (lockToLive) {
        const minPos = Math.max(end - liveDelay - 0.25, 0)
        if (v.currentTime < minPos) seekToLive(v)
      }
    }, 800)
  }

  function init() {
    destroy()
    errorMessage.value = null
    const v = videoRef.value
    const src = toValue(cfg.src)
    if (!v || !src) return

    const { autoplay, muted, controls, playsinline, lockToLive, liveDelay, maxDelaySec } = options()

    v.autoplay = autoplay
    v.muted = muted
    v.controls = controls
    v.playsInline = playsinline
    try {
      ;(v as any).crossOrigin = 'anonymous'
    } catch {}

    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV

    if (v.canPlayType('application/vnd.apple.mpegurl')) {
      if (isDev) console.debug('[HlsStream] Native HLS')
      v.src = src
      const onLoaded = () => {
        v.play().catch(
          (err) => isDev && console.warn('[HlsStream] autoplay rejected (native)', err),
        )
        if (lockToLive) seekToLive(v)
        startKeepLive()
        v.removeEventListener('loadedmetadata', onLoaded)
      }
      v.addEventListener('loadedmetadata', onLoaded)
      v.addEventListener('seeking', () => {
        const end = getLiveEdge(v)
        if (end == null) return
        const allowedMin = Math.max(end - maxDelaySec, 0)
        if (v.currentTime < allowedMin) v.currentTime = allowedMin
        else if (lockToLive) seekToLive(v)
      })
      v.addEventListener('error', () => {
        const err: any = (v as any).error
        errorMessage.value = `Erro no vídeo (nativo): code=${err?.code ?? 'n/a'}`
        isDev && console.error('[HlsStream] Native video error', err)
      })
      return
    }

    if (Hls.isSupported()) {
      if (isDev) console.debug('[HlsStream] hls.js')
      const h = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: Math.max(65, maxDelaySec + 5),
        maxBufferLength: 12,
        liveSyncDuration: liveDelay,
        liveMaxLatencyDuration: Math.max(liveDelay + 4, maxDelaySec),
        debug: !!isDev,
        xhrSetup: (xhr, url) => {
          try {
            ;(xhr as any).withCredentials = false
          } catch {}
          isDev && console.debug('[HlsStream] XHR', url)
        },
      })
      hls = h
      h.attachMedia(v)
      h.on(Hls.Events.MEDIA_ATTACHED, () => h.loadSource(src))
      h.on(Hls.Events.MANIFEST_PARSED, () => {
        v.play().catch((err) => isDev && console.warn('[HlsStream] autoplay rejected', err))
        if (lockToLive) seekToLive(v)
        startKeepLive()
      })
      h.on(Hls.Events.ERROR, (_evt, data) => {
        isDev && console.error('[HlsStream] HLS error', data)
        if (!data?.fatal) return
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            errorMessage.value = `HLS (rede): ${data.details ?? 'erro de rede'}`
            h.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            errorMessage.value = `HLS (mídia): tentando recuperar`
            h.recoverMediaError()
            break
          default:
            errorMessage.value = `HLS (fatal): reiniciando`
            try {
              h.destroy()
            } catch {}
            init()
            break
        }
      })
      v.addEventListener('seeking', () => {
        const end = getLiveEdge(v)
        if (end == null) return
        const allowedMin = Math.max(end - maxDelaySec, 0)
        if (v.currentTime < allowedMin) v.currentTime = allowedMin
        else if (lockToLive) seekToLive(v)
      })
      v.addEventListener('error', () => {
        const err: any = (v as any).error
        errorMessage.value = `Erro no vídeo: code=${err?.code ?? 'n/a'}`
        isDev && console.error('[HlsStream] Video element error', err)
      })
      return
    }

    errorMessage.value = 'HLS não suportado neste navegador'
  }

  onMounted(init)
  onBeforeUnmount(destroy)
  watch(
    () => toValue(cfg.src),
    () => init(),
  )

  return {
    videoRef,
    errorMessage,
    init,
    destroy,
  }
}
