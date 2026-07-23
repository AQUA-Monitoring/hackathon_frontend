import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import FloodDemoApi from '../services/FloodDemo'
import { useAuthStore } from '@/modules/auth/stores/auth'
import type { FloodDemoPrediction, FloodDemoState, FloodDemoStream } from '../types/floodDemo'
import { parseApiError } from '@/utils/apiError'

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

  const isAdmin = computed(() => authStore.user?.type === 'admin')
  const isReady = computed(
    () => stream.value?.enabled && stream.value.status === 'ready' && !!stream.value.hls_url,
  )

  function predictionErrorMessage(error: unknown) {
    const parsed = parseApiError(error, 'Não foi possível consultar a predição.')
    if (parsed.status === 503) return 'O modelo ou o segmento ainda está sendo preparado.'
    if (parsed.status === 504) {
      return 'A captura dos frames demorou mais que o esperado. Tentaremos novamente.'
    }
    return parsed.message
  }

  async function loadStream() {
    try {
      const nextStream = await demoApi.getStream()
      const sessionChanged =
        stream.value?.session_id && nextStream.session_id !== stream.value.session_id

      if (sessionChanged) {
        prediction.value = null
        predictionMessage.value =
          'A sessão mudou. Aguardando a primeira análise da nova transmissão.'
      }

      stream.value = nextStream
      pageError.value = null
    } catch (error) {
      pageError.value = parseApiError(
        error,
        'Não foi possível consultar a transmissão demo.',
      ).message
    } finally {
      loading.value = false
    }
  }

  async function loadPrediction() {
    if (!isReady.value) return

    predictionLoading.value = true
    try {
      const result = await demoApi.getPrediction()
      if (result.session_id !== stream.value?.session_id) {
        prediction.value = null
        predictionMessage.value = 'A transmissão iniciou uma nova sessão. Atualizando o player...'
        await loadStream()
        return
      }
      prediction.value = result
      predictionMessage.value = null
    } catch (error) {
      predictionMessage.value = predictionErrorMessage(error)
    } finally {
      predictionLoading.value = false
    }
  }

  async function refresh() {
    if (pollInFlight) return
    pollInFlight = true
    try {
      await loadStream()
      await loadPrediction()
    } finally {
      pollInFlight = false
    }
  }

  async function changeState(state: FloodDemoState) {
    if (!isAdmin.value || changingState.value) return

    changingState.value = state
    actionMessage.value = null
    try {
      await demoApi.setState(state)
      prediction.value = null
      predictionMessage.value = 'Estado alterado. Aguardando a nova sessão ficar disponível.'
      await loadStream()
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
    await refresh()
    pollingTimer = window.setInterval(refresh, POLLING_INTERVAL_MS)
  })

  onBeforeUnmount(() => {
    if (pollingTimer !== null) window.clearInterval(pollingTimer)
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
