import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import FloodDemoApi from './services/FloodDemo'
import { useAuthStore } from '@/modules/auth'
import type {
  FloodDemoPrediction,
  FloodDemoSourceSlot,
  FloodDemoState,
  FloodDemoStream,
} from './floodDemo'
import { parseApiError } from '@/shared'

// O HLS da demo publica um segmento novo a cada 2 s. Consultar no mesmo ritmo
// mantém a predição próxima do quadro exibido sem repetir inferência no segmento.
const POLLING_INTERVAL_MS = 2000

export function useFloodDemo() {
  const demoApi = new FloodDemoApi()
  const authStore = useAuthStore()
  const stream = ref<FloodDemoStream | null>(null)
  const prediction = ref<FloodDemoPrediction | null>(null)
  const playerSegmentSequence = ref<number | null>(null)
  const loading = ref(true)
  const predictionLoading = ref(false)
  const predictionHasError = ref(false)
  const changingState = ref<FloodDemoState | null>(null)
  const pageError = ref<string | null>(null)
  const predictionMessage = ref<string | null>(null)
  const actionMessage = ref<string | null>(null)
  const sources = ref<FloodDemoSourceSlot[]>([])
  const sourcesLoading = ref(false)
  const sourcesMessage = ref<string | null>(null)
  const uploadingMode = ref<FloodDemoState | null>(null)
  const uploadProgress = ref<number | null>(null)
  let pollingTimer: number | null = null
  let pollInFlight = false
  let pendingSegmentRefresh = false
  let requestGeneration = 0
  let requestController: AbortController | null = null
  let mounted = false

  const isAdmin = computed(
    () => authStore.user?.type === 'admin' || authStore.user?.is_superuser === true,
  )
  const isSuperuser = computed(() => authStore.user?.is_superuser === true)
  const isSourceProcessing = computed(() =>
    sources.value.some((source) => source.status === 'processing'),
  )
  const isReady = computed(
    () => stream.value?.enabled && stream.value.status === 'ready' && !!stream.value.hls_url,
  )
  const synchronizedPrediction = computed(() => {
    if (!prediction.value) return null
    if (playerSegmentSequence.value === null) return prediction.value
    return prediction.value.segment.sequence === playerSegmentSequence.value
      ? prediction.value
      : null
  })
  const synchronizedPredictionMessage = computed(() => {
    if (
      prediction.value &&
      playerSegmentSequence.value !== null &&
      prediction.value.segment.sequence !== playerSegmentSequence.value
    ) {
      return 'Aguardando a análise correspondente ao trecho exibido.'
    }
    return predictionMessage.value
  })
  const predictionUnavailable = computed(() => {
    const streamStatus = stream.value?.status
    return (
      predictionHasError.value ||
      streamStatus === 'disabled' ||
      streamStatus === 'unavailable' ||
      streamStatus === 'error'
    )
  })

  function predictionFailure(error: unknown) {
    const parsed = parseApiError(error, 'Não foi possível consultar a predição.')
    if (parsed.status === 503)
      return {
        message: 'O modelo ou o serviço de análise não está disponível.',
        unavailable: true,
      }
    if (parsed.status === 504) {
      return {
        message: 'Não foi possível capturar os frames da demonstração no tempo esperado.',
        unavailable: true,
      }
    }
    if (parsed.status === 409 || parsed.status === 410) {
      return {
        message: 'O vídeo avançou antes da análise desse trecho. Sincronizando novamente.',
        unavailable: false,
      }
    }
    return { message: parsed.message, unavailable: true }
  }

  function isCurrentRequest(generation: number) {
    return mounted && generation === requestGeneration
  }

  function cancelRequests() {
    requestGeneration += 1
    requestController?.abort()
    requestController = null
    pollInFlight = false
    pendingSegmentRefresh = false
  }

  async function loadStream(generation: number, signal: AbortSignal) {
    try {
      const nextStream = await demoApi.getStream(signal)
      if (!isCurrentRequest(generation)) return false
      const sessionChanged =
        stream.value?.session_id && nextStream.session_id !== stream.value.session_id

      // O backend só publica uma nova sessão depois de preparar o upload. Até
      // lá, preserve a transmissão que a pessoa já está assistindo.
      if (
        (uploadingMode.value || isSourceProcessing.value) &&
        stream.value?.hls_url &&
        !sessionChanged
      ) {
        pageError.value = null
        return true
      }

      if (sessionChanged) {
        prediction.value = null
        predictionHasError.value = false
        playerSegmentSequence.value = null
        predictionMessage.value =
          'A sessão mudou. Aguardando a primeira análise da nova transmissão.'
      }

      stream.value = nextStream
      pageError.value = null
      return true
    } catch (error) {
      if (!isCurrentRequest(generation) || signal.aborted) return false
      pageError.value = parseApiError(
        error,
        'Não foi possível consultar a transmissão demo.',
      ).message
      return false
    } finally {
      if (isCurrentRequest(generation)) loading.value = false
    }
  }

  async function loadSources(generation: number, signal: AbortSignal) {
    if (!isAdmin.value) return
    sourcesLoading.value = sources.value.length === 0
    try {
      const result = await demoApi.getSources(signal)
      if (!isCurrentRequest(generation)) return
      sources.value = result
      sourcesMessage.value = null
    } catch (error) {
      if (!isCurrentRequest(generation) || signal.aborted) return
      const parsed = parseApiError(error, 'Não foi possível consultar os vídeos da demo.')
      sourcesMessage.value =
        parsed.status === 503
          ? 'O serviço de vídeos da demonstração está indisponível no momento.'
          : parsed.message
    } finally {
      if (isCurrentRequest(generation)) sourcesLoading.value = false
    }
  }

  async function loadPrediction(generation: number, signal: AbortSignal) {
    if (!isReady.value) return

    const requestedSession = stream.value?.session_id
    const requestedSequence = playerSegmentSequence.value
    if (requestedSequence === null) {
      prediction.value = null
      predictionHasError.value = false
      predictionMessage.value = 'Aguardando a identificação do trecho exibido no player.'
      return
    }
    predictionHasError.value = false
    predictionLoading.value = true
    try {
      const result = await demoApi.getPrediction(requestedSequence, signal)
      if (!isCurrentRequest(generation) || requestedSession !== stream.value?.session_id) return
      if (
        playerSegmentSequence.value !== requestedSequence ||
        result.segment.sequence !== requestedSequence
      ) {
        prediction.value = null
        predictionHasError.value = false
        predictionMessage.value = 'O vídeo avançou. Aguardando a análise do trecho atual.'
        return
      }
      if (result.session_id !== requestedSession) {
        prediction.value = null
        predictionHasError.value = false
        predictionMessage.value = 'A transmissão iniciou uma nova sessão. Atualizando o player...'
        scheduleRefresh(0)
        return
      }
      prediction.value = result
      predictionHasError.value = false
      predictionMessage.value = null
    } catch (error) {
      if (!isCurrentRequest(generation) || signal.aborted) return
      const failure = predictionFailure(error)
      prediction.value = null
      predictionHasError.value = failure.unavailable
      predictionMessage.value = failure.message
    } finally {
      if (isCurrentRequest(generation)) predictionLoading.value = false
    }
  }

  async function refresh() {
    if (pollInFlight || document.hidden || !navigator.onLine) return
    pollInFlight = true
    const generation = ++requestGeneration
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    try {
      await loadSources(generation, controller.signal)
      const streamLoaded = await loadStream(generation, controller.signal)
      if (streamLoaded) await loadPrediction(generation, controller.signal)
    } finally {
      if (generation === requestGeneration) {
        pollInFlight = false
        requestController = null
        const delay = pendingSegmentRefresh ? 0 : POLLING_INTERVAL_MS
        pendingSegmentRefresh = false
        scheduleRefresh(delay)
      }
    }
  }

  function clearPollingTimer() {
    if (pollingTimer !== null) {
      window.clearTimeout(pollingTimer)
      pollingTimer = null
    }
  }

  function scheduleRefresh(delay = POLLING_INTERVAL_MS) {
    clearPollingTimer()
    if (!mounted || document.hidden || !navigator.onLine) return
    pollingTimer = window.setTimeout(refresh, delay)
  }

  function handlePollingAvailability() {
    if (document.hidden || !navigator.onLine) {
      clearPollingTimer()
      cancelRequests()
      predictionLoading.value = false
      return
    }
    scheduleRefresh(0)
  }

  async function changeState(state: FloodDemoState) {
    if (!isAdmin.value || changingState.value) return

    changingState.value = state
    actionMessage.value = null
    clearPollingTimer()
    cancelRequests()
    try {
      const nextStream = await demoApi.setState(state)
      stream.value = nextStream
      prediction.value = null
      predictionHasError.value = false
      playerSegmentSequence.value = null
      predictionMessage.value =
        nextStream.status === 'ready'
          ? 'Estado alterado. Aguardando a análise da nova transmissão.'
          : 'Estado alterado. Aguardando a nova sessão ficar disponível.'
      scheduleRefresh(0)
    } catch (error) {
      const parsed = parseApiError(error, 'Não foi possível alterar o estado da transmissão.')
      if (parsed.status === 400) {
        actionMessage.value = 'Este estado é inválido ou não está disponível nesta demo.'
      } else if (parsed.status === 401) {
        actionMessage.value = 'Sua sessão expirou. Entre novamente para alterar a demo.'
      } else if (parsed.status === 403) {
        actionMessage.value = 'Apenas administradores podem alterar a transmissão.'
      } else {
        actionMessage.value = parsed.message
      }
    } finally {
      changingState.value = null
    }
  }

  function uploadErrorMessage(error: unknown) {
    const parsed = parseApiError(error, 'Não foi possível enviar o vídeo.')
    if (parsed.status === 413) return 'O arquivo excede o tamanho máximo permitido.'
    if (parsed.status === 415) return 'Formato não aceito. Envie um vídeo compatível.'
    if (parsed.status === 422) return 'O vídeo não pôde ser validado ou processado.'
    if (parsed.status === 409) return 'Este modo já possui um vídeo em processamento.'
    if (parsed.status === 503) return 'O processamento de vídeos está indisponível no momento.'
    if (parsed.status === 403) return 'Somente superusuários podem substituir os vídeos.'
    return parsed.message
  }

  async function uploadSource(mode: FloodDemoState, file: File) {
    if (!isSuperuser.value || uploadingMode.value) return
    uploadingMode.value = mode
    uploadProgress.value = 0
    sourcesMessage.value = null
    try {
      const source = await demoApi.uploadSource(mode, file, (progress) => {
        uploadProgress.value = progress
      })
      const index = sources.value.findIndex((item) => item.mode === mode)
      if (index >= 0) sources.value.splice(index, 1, source)
      else sources.value.push(source)
      sourcesMessage.value = 'Upload concluído. O vídeo está sendo preparado.'
      scheduleRefresh(0)
    } catch (error) {
      sourcesMessage.value = uploadErrorMessage(error)
    } finally {
      uploadingMode.value = null
      uploadProgress.value = null
    }
  }

  function setPlayerSegmentSequence(sequence: number | null) {
    if (playerSegmentSequence.value === sequence) return
    playerSegmentSequence.value = sequence
    prediction.value = null
    predictionHasError.value = false
    predictionMessage.value =
      sequence === null
        ? 'Aguardando a identificação do trecho exibido no player.'
        : 'Analisando o trecho exibido no player.'
    if (pollInFlight) {
      pendingSegmentRefresh = true
    } else {
      scheduleRefresh(0)
    }
  }

  onMounted(async () => {
    mounted = true
    document.addEventListener('visibilitychange', handlePollingAvailability)
    window.addEventListener('online', handlePollingAvailability)
    window.addEventListener('offline', handlePollingAvailability)
    await refresh()
  })

  onBeforeUnmount(() => {
    mounted = false
    clearPollingTimer()
    cancelRequests()
    document.removeEventListener('visibilitychange', handlePollingAvailability)
    window.removeEventListener('online', handlePollingAvailability)
    window.removeEventListener('offline', handlePollingAvailability)
  })

  return {
    stream,
    prediction: synchronizedPrediction,
    loading,
    predictionLoading,
    changingState,
    pageError,
    predictionMessage: synchronizedPredictionMessage,
    predictionUnavailable,
    actionMessage,
    sources,
    sourcesLoading,
    sourcesMessage,
    uploadingMode,
    uploadProgress,
    isAdmin,
    isSuperuser,
    isReady,
    refresh,
    changeState,
    uploadSource,
    setPlayerSegmentSequence,
  }
}
