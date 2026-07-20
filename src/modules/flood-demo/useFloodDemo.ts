import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import FloodDemoApi from './services/FloodDemo'
import { useAuthStore } from '@/modules/auth'
import type { FloodDemoPrediction, FloodDemoState, FloodDemoStream } from './floodDemo'
import { parseApiError } from '@/shared'

const POLLING_INTERVAL_MS = 5000

export function useFloodDemo() {
  const demoApi = new FloodDemoApi()
  const authStore = useAuthStore()
  const stream = ref<FloodDemoStream | null>(null)
  const prediction = ref<FloodDemoPrediction | null>(null)
  const loading = ref(true)
  const predictionLoading = ref(false)
  const changingState = ref<FloodDemoState | null>(null)
  const pageError = ref<string | null>(null)
  const predictionMessage = ref<string | null>(null)
  const actionMessage = ref<string | null>(null)
  let pollingTimer: number | null = null
  let pollInFlight = false
  let requestGeneration = 0
  let requestController: AbortController | null = null
  let mounted = false

  const isAdmin = computed(() => authStore.user?.type === 'admin')
  const isReady = computed(
    () => stream.value?.enabled && stream.value.status === 'ready' && !!stream.value.hls_url,
  )

  function predictionErrorMessage(error: unknown) {
    const parsed = parseApiError(error, 'Não foi possível consultar a predição.')
    if (parsed.status === 503)
      return 'Análise indisponível. O modelo ou o segmento ainda não está pronto.'
    if (parsed.status === 504) {
      return 'A captura dos frames demorou mais que o esperado. Tentaremos novamente.'
    }
    return parsed.message
  }

  function isCurrentRequest(generation: number) {
    return mounted && generation === requestGeneration
  }

  function cancelRequests() {
    requestGeneration += 1
    requestController?.abort()
    requestController = null
    pollInFlight = false
  }

  async function loadStream(generation: number, signal: AbortSignal) {
    try {
      const nextStream = await demoApi.getStream(signal)
      if (!isCurrentRequest(generation)) return false
      const sessionChanged =
        stream.value?.session_id && nextStream.session_id !== stream.value.session_id

      if (sessionChanged) {
        prediction.value = null
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

  async function loadPrediction(generation: number, signal: AbortSignal) {
    if (!isReady.value) return

    const requestedSession = stream.value?.session_id
    predictionLoading.value = true
    try {
      const result = await demoApi.getPrediction(signal)
      if (!isCurrentRequest(generation) || requestedSession !== stream.value?.session_id) return
      if (result.session_id !== requestedSession) {
        prediction.value = null
        predictionMessage.value = 'A transmissão iniciou uma nova sessão. Atualizando o player...'
        scheduleRefresh(0)
        return
      }
      prediction.value = result
      predictionMessage.value = null
    } catch (error) {
      if (!isCurrentRequest(generation) || signal.aborted) return
      prediction.value = null
      predictionMessage.value = predictionErrorMessage(error)
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
      const streamLoaded = await loadStream(generation, controller.signal)
      if (streamLoaded) await loadPrediction(generation, controller.signal)
    } finally {
      if (generation === requestGeneration) {
        pollInFlight = false
        requestController = null
        scheduleRefresh()
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
      await demoApi.setState(state)
      prediction.value = null
      predictionMessage.value = 'Estado alterado. Aguardando a nova sessão ficar disponível.'
      await refresh()
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
    prediction,
    loading,
    predictionLoading,
    changingState,
    pageError,
    predictionMessage,
    actionMessage,
    isAdmin,
    isReady,
    refresh,
    changeState,
  }
}
