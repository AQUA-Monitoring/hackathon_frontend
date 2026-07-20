import Hls from 'hls.js'
import { onBeforeUnmount, onMounted, ref, watch, toValue, type Ref } from 'vue'
import type { HlsOptions } from '../types/hls'

export function useHlsStream(cfg: {
  src: string | Ref<string>
  options?: HlsOptions | Ref<HlsOptions>
}) {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const errorMessage = ref<string | null>(null)
  let hls: Hls | null = null
  let keepLiveTimer: number | null = null
  let retryTimer: number | null = null
  let retryAttempt = 0
  let streamGeneration = 0
  const videoListeners: Array<[keyof HTMLMediaElementEventMap, EventListener]> = []

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
    if (retryTimer !== null) {
      window.clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  function destroy() {
    streamGeneration += 1
    if (hls) {
      try {
        hls.destroy()
      } catch {}
      hls = null
    }
    const v = videoRef.value
    if (v) {
      for (const [event, listener] of videoListeners.splice(0)) {
        v.removeEventListener(event, listener)
      }
      v.pause()
      try {
        v.removeAttribute('src')
        v.load()
      } catch {}
    }
    clearTimer()
  }

  function retry(message: string) {
    const maxRetries = 4
    if (retryTimer !== null) return
    if (retryAttempt >= maxRetries) {
      errorMessage.value = `${message}. Transmissão indisponível após ${maxRetries} tentativas.`
      return
    }

    retryAttempt += 1
    const delay = Math.min(1000 * 2 ** (retryAttempt - 1), 8000)
    errorMessage.value = `${message}. Nova tentativa ${retryAttempt}/${maxRetries} em ${delay / 1000}s.`
    const generation = streamGeneration
    retryTimer = window.setTimeout(() => {
      retryTimer = null
      if (generation === streamGeneration) initialize(false)
    }, delay)
  }

  function listen<K extends keyof HTMLMediaElementEventMap>(
    video: HTMLVideoElement,
    event: K,
    listener: (event: HTMLMediaElementEventMap[K]) => void,
  ) {
    const callback = listener as EventListener
    video.addEventListener(event, callback)
    videoListeners.push([event, callback])
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

  function initialize(resetRetries: boolean) {
    destroy()
    if (resetRetries) retryAttempt = 0
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
      v.crossOrigin = 'anonymous'
    } catch {}

    const isDev = import.meta.env.DEV

    if (v.canPlayType('application/vnd.apple.mpegurl')) {
      if (isDev) console.debug('[HlsStream] Native HLS')
      v.src = src
      const onLoaded = () => {
        retryAttempt = 0
        errorMessage.value = null
        if (autoplay) {
          v.play().catch((err) => {
            if (isDev) console.warn('[HlsStream] autoplay rejected (native)', err)
          })
        }
        if (lockToLive) seekToLive(v)
        startKeepLive()
      }
      listen(v, 'loadedmetadata', onLoaded)
      listen(v, 'seeking', () => {
        const end = getLiveEdge(v)
        if (end == null) return
        const allowedMin = Math.max(end - maxDelaySec, 0)
        if (v.currentTime < allowedMin) v.currentTime = allowedMin
        else if (lockToLive) seekToLive(v)
      })
      listen(v, 'error', () => {
        const err = v.error
        retry(`Erro no vídeo nativo (code=${err?.code ?? 'n/a'})`)
        if (isDev) console.error('[HlsStream] Native video error', err)
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
            xhr.withCredentials = false
          } catch {}
          if (isDev) console.debug('[HlsStream] XHR', url)
        },
      })
      hls = h
      h.attachMedia(v)
      h.on(Hls.Events.MEDIA_ATTACHED, () => h.loadSource(src))
      h.on(Hls.Events.MANIFEST_PARSED, () => {
        retryAttempt = 0
        errorMessage.value = null
        if (autoplay) {
          v.play().catch((err) => {
            if (isDev) console.warn('[HlsStream] autoplay rejected', err)
          })
        }
        if (lockToLive) seekToLive(v)
        startKeepLive()
      })
      h.on(Hls.Events.ERROR, (_evt, data) => {
        if (isDev) console.error('[HlsStream] HLS error', data)
        if (!data?.fatal) return
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            retry(`HLS (rede): ${data.details ?? 'erro de rede'}`)
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            if (retryAttempt === 0) {
              retryAttempt += 1
              errorMessage.value = 'HLS (mídia): tentando recuperar (1/4).'
              h.recoverMediaError()
            } else {
              retry('HLS (mídia): falha na recuperação')
            }
            break
          default:
            retry('HLS (fatal)')
            break
        }
      })
      listen(v, 'seeking', () => {
        const end = getLiveEdge(v)
        if (end == null) return
        const allowedMin = Math.max(end - maxDelaySec, 0)
        if (v.currentTime < allowedMin) v.currentTime = allowedMin
        else if (lockToLive) seekToLive(v)
      })
      listen(v, 'error', () => {
        const err = v.error
        retry(`Erro no vídeo (code=${err?.code ?? 'n/a'})`)
        if (isDev) console.error('[HlsStream] Video element error', err)
      })
      return
    }

    errorMessage.value = 'HLS não suportado neste navegador'
  }

  function init() {
    initialize(true)
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
