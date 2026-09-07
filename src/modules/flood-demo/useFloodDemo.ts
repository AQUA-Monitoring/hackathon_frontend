import { computed, onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
import FloodDemoApi from './services/FloodDemo'
import { useAuthStore } from '@/modules/auth'
import type {
  FloodDemoPrediction,
  FloodDemoPredictionBatch,
  FloodDemoPredictionBatchItem,
  FloodDemoRepresentativeImage,
  FloodDemoSourceSlot,
  FloodDemoState,
  FloodDemoStream,
} from './floodDemo'
import { parseApiError } from '@/shared'
import {
  isCompletedAnalysisPrevious,
  shouldPromoteCompletedAnalysis,
} from './demoAnalysisState'

// O HLS da demo publica um segmento novo a cada 2 s. Consultar no mesmo ritmo
// mantém a predição próxima do quadro exibido sem repetir inferência no segmento.
const POLLING_INTERVAL_MS = 2000
const REPRESENTATIVE_IMAGE_UNAVAILABLE = 'Quadro expirado ou indisponível'

interface RepresentativeImageAsset {
  blob: Blob | null
  url: string | null
  unavailable: boolean
}

export function useFloodDemo() {
  const demoApi = new FloodDemoApi()
  const authStore = useAuthStore()
  const stream = ref<FloodDemoStream | null>(null)
  const prediction = ref<FloodDemoPrediction | null>(null)
  const predictionBatch = ref<FloodDemoPredictionBatch | null>(null)
  const pinnedAnalysis = ref<{
    prediction: FloodDemoPrediction
    batch: FloodDemoPredictionBatch
  } | null>(null)
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
  const pinMessage = ref<string | null>(null)
  const representativeImageRevision = ref(0)
  let pollingTimer: number | null = null
  let pollInFlight = false
  let pendingSegmentRefresh = false
  let requestGeneration = 0
  let requestController: AbortController | null = null
  let mounted = false
  let activeBufferSession: string | null = null
  let activeBufferModel: string | null = null
  const predictionBuffer = new Map<string, FloodDemoPredictionBatchItem>()
  const liveRepresentativeImages = new Map<string, RepresentativeImageAsset>()
  const pinnedRepresentativeImages = new Map<string, RepresentativeImageAsset>()

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
  const analysisPinned = computed(() => pinnedAnalysis.value !== null)
  const displayedPrediction = computed(
    () => pinnedAnalysis.value?.prediction ?? prediction.value,
  )
  const displayedPredictionBatch = computed(
    () => pinnedAnalysis.value?.batch ?? predictionBatch.value,
  )
  const pinnedAnalysisIsPrevious = computed(
    () =>
      analysisPinned.value &&
      (predictionHasError.value ||
        (synchronizedPrediction.value === null &&
          predictionMessage.value !== null &&
          !predictionLoading.value) ||
        pinnedAnalysis.value?.batch.anchor_sequence !== playerSegmentSequence.value),
  )
  const displayedAnalysisIsPrevious = computed(
    () =>
      !analysisPinned.value &&
      isCompletedAnalysisPrevious(
        prediction.value?.segment.sequence,
        playerSegmentSequence.value,
      ),
  )
  const synchronizedPredictionMessage = computed(() => {
    if (
      prediction.value &&
      playerSegmentSequence.value !== null &&
      prediction.value.segment.sequence !== playerSegmentSequence.value
    ) {
      return 'Trecho anterior — atualizando análise.'
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

  function plainDto<T>(value: T): T {
    const raw = toRaw(value)
    if (Array.isArray(raw)) return raw.map((item) => plainDto(item)) as T
    if (raw && typeof raw === 'object') {
      return Object.fromEntries(
        Object.entries(raw).map(([key, nested]) => [key, plainDto(nested)]),
      ) as T
    }
    return raw
  }

  function deepFrozenCopy<T>(value: T): T {
    const clone = structuredClone(plainDto(value))
    const freeze = (item: object) => {
      for (const nested of Object.values(item)) {
        if (nested && typeof nested === 'object' && !Object.isFrozen(nested)) {
          freeze(nested)
        }
      }
      return Object.freeze(item)
    }
    return freeze(clone as object) as T
  }

  function pinAnalysis() {
    if (
      !prediction.value ||
      !predictionBatch.value ||
      predictionBatch.value.anchor_sequence !== prediction.value.segment.sequence
    )
      return
    pinMessage.value = null
    try {
      revokeRepresentativeImages(pinnedRepresentativeImages)
      for (const item of predictionBatch.value.results) {
        const key = predictionBufferKey(
          predictionBatch.value.session_id,
          predictionBatch.value.model.version,
          item.sequence,
        )
        const liveAsset = liveRepresentativeImages.get(key)
        if (!liveAsset) continue
        pinnedRepresentativeImages.set(key, {
          blob: liveAsset.blob,
          url: liveAsset.blob ? URL.createObjectURL(liveAsset.blob) : null,
          unavailable: liveAsset.unavailable,
        })
      }
      pinnedAnalysis.value = deepFrozenCopy({
        prediction: prediction.value,
        batch: predictionBatch.value,
      })
      representativeImageRevision.value += 1
    } catch {
      revokeRepresentativeImages(pinnedRepresentativeImages)
      pinnedAnalysis.value = null
      pinMessage.value = 'Não foi possível fixar esta análise. Tente novamente no trecho atual.'
    }
  }

  function resumeLiveAnalysis() {
    revokeRepresentativeImages(pinnedRepresentativeImages)
    pinnedAnalysis.value = null
    pinMessage.value = null
    representativeImageRevision.value += 1
  }

  function clearPredictionBuffer() {
    revokeRepresentativeImages(liveRepresentativeImages)
    predictionBuffer.clear()
    activeBufferSession = null
    activeBufferModel = null
    predictionBatch.value = null
  }

  function revokeRepresentativeImages(images: Map<string, RepresentativeImageAsset>) {
    for (const asset of images.values()) {
      if (asset.url) URL.revokeObjectURL(asset.url)
    }
    images.clear()
  }

  function predictionBufferKey(sessionId: string, modelVersion: string | null, sequence: number) {
    return `${sessionId}\u0000${modelVersion ?? ''}\u0000${sequence}`
  }

  function isValidRepresentativeImage(
    descriptor: FloodDemoRepresentativeImage,
    batch: FloodDemoPredictionBatch,
    item: FloodDemoPredictionBatchItem,
  ) {
    const isPublicHttpUrl =
      typeof descriptor.url === 'string' &&
      demoApi.isRepresentativeImageUrlAllowed(descriptor.url)
    return (
      batch.schema_version === 4 &&
      descriptor.content_type === 'image/jpeg' &&
      isPublicHttpUrl &&
      typeof descriptor.session_id === 'string' &&
      descriptor.session_id === batch.session_id &&
      Number.isInteger(descriptor.sequence) &&
      descriptor.sequence === item.sequence &&
      typeof descriptor.model_version === 'string' &&
      descriptor.model_version === batch.model.version &&
      typeof descriptor.expires_at === 'string' &&
      Number.isFinite(Date.parse(descriptor.expires_at)) &&
      Date.parse(descriptor.expires_at) > Date.now()
    )
  }

  async function loadRepresentativeImages(batch: FloodDemoPredictionBatch, signal: AbortSignal) {
    const candidates = batch.results
      .filter(
        (item) =>
          item.status === 'available' &&
          item.representative_image !== null &&
          isValidRepresentativeImage(item.representative_image, batch, item),
      )
      .slice(-3)

    await Promise.all(
      candidates.map(async (item) => {
        const key = predictionBufferKey(batch.session_id, batch.model.version, item.sequence)
        if (liveRepresentativeImages.has(key)) return
        try {
          const blob = await demoApi.getRepresentativeImage(item.representative_image!.url, signal)
          if (signal.aborted) return
          liveRepresentativeImages.set(key, {
            blob,
            url: URL.createObjectURL(blob),
            unavailable: false,
          })
        } catch {
          if (signal.aborted) return
          liveRepresentativeImages.set(key, { blob: null, url: null, unavailable: true })
        }
      }),
    )

    for (const item of batch.results) {
      const descriptor = item.representative_image
      const key = predictionBufferKey(batch.session_id, batch.model.version, item.sequence)
      if (!descriptor) {
        if (item.status === 'available' && !liveRepresentativeImages.has(key)) {
          liveRepresentativeImages.set(key, { blob: null, url: null, unavailable: true })
        }
        continue
      }
      if (!isValidRepresentativeImage(descriptor, batch, item)) {
        const previous = liveRepresentativeImages.get(key)
        if (previous?.url) URL.revokeObjectURL(previous.url)
        liveRepresentativeImages.set(key, { blob: null, url: null, unavailable: true })
      }
    }
    representativeImageRevision.value += 1
  }

  function displayedRepresentativeImage(sequence: number) {
    void representativeImageRevision.value
    const batch = displayedPredictionBatch.value
    if (!batch) return { url: null, unavailable: false }
    const key = predictionBufferKey(batch.session_id, batch.model.version, sequence)
    const asset = analysisPinned.value
      ? pinnedRepresentativeImages.get(key)
      : liveRepresentativeImages.get(key)
    return asset
      ? { url: asset.url, unavailable: asset.unavailable }
      : { url: null, unavailable: false }
  }

  function storeBatchInBuffer(batch: FloodDemoPredictionBatch) {
    const modelVersion = batch.model.version
    if (activeBufferSession !== batch.session_id || activeBufferModel !== modelVersion) {
      if (
        analysisPinned.value &&
        activeBufferSession === batch.session_id &&
        activeBufferModel !== modelVersion
      ) {
        resumeLiveAnalysis()
      }
      predictionBuffer.clear()
      activeBufferSession = batch.session_id
      activeBufferModel = modelVersion
    }
    for (const item of batch.results) {
      const key = predictionBufferKey(batch.session_id, modelVersion, item.sequence)
      const buffered = predictionBuffer.get(key)
      if (!buffered || item.status === 'available' || buffered.status !== 'available') {
        predictionBuffer.set(key, item)
      }
    }
    const chronological = [...predictionBuffer.values()]
      .sort((left, right) => left.sequence - right.sequence)
      .slice(-3)
    const retainedKeys = new Set(
      chronological.map((item) =>
        predictionBufferKey(batch.session_id, modelVersion, item.sequence),
      ),
    )
    for (const [key, asset] of liveRepresentativeImages) {
      if (!retainedKeys.has(key)) {
        if (asset.url) URL.revokeObjectURL(asset.url)
        liveRepresentativeImages.delete(key)
      }
    }
    predictionBuffer.clear()
    for (const item of chronological) {
      predictionBuffer.set(predictionBufferKey(batch.session_id, modelVersion, item.sequence), item)
    }
    predictionBatch.value = {
      ...batch,
      results: chronological,
      partial: batch.partial || chronological.some((item) => item.status !== 'available'),
    }
  }

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

  function predictionErrorCode(error: unknown) {
    if (!error || typeof error !== 'object' || !('response' in error)) return null
    const response = error.response
    if (!response || typeof response !== 'object' || !('data' in response)) return null
    const data = response.data
    if (!data || typeof data !== 'object' || !('error' in data)) return null
    const apiError = data.error
    if (!apiError || typeof apiError !== 'object' || !('code' in apiError)) return null
    return typeof apiError.code === 'string' ? apiError.code : null
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
      const stateChanged =
        stream.value !== null && nextStream.demo_state !== stream.value.demo_state

      // O backend só publica uma nova sessão depois de preparar o upload. Até
      // lá, preserve a transmissão que a pessoa já está assistindo.
      if (
        (uploadingMode.value || isSourceProcessing.value) &&
        stream.value?.hls_url &&
        !sessionChanged &&
        !stateChanged
      ) {
        pageError.value = null
        return true
      }

      if (sessionChanged || stateChanged) {
        resumeLiveAnalysis()
        clearPredictionBuffer()
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
      if (!requestedSession) {
        prediction.value = null
        predictionBatch.value = null
        predictionMessage.value = 'Aguardando a identificação da sessão exibida no player.'
        return
      }
      const result = await demoApi.getPredictionBatch(
        {
          session_id: requestedSession,
          anchor_sequence: requestedSequence,
          ...(activeBufferModel ? { model_version: activeBufferModel } : {}),
        },
        signal,
      )
      if (!isCurrentRequest(generation) || requestedSession !== stream.value?.session_id) return
      if (result.anchor_sequence !== requestedSequence) return
      if (result.session_id !== requestedSession) {
        prediction.value = null
        predictionBatch.value = null
        predictionHasError.value = false
        predictionMessage.value = 'A transmissão iniciou uma nova sessão. Atualizando o player...'
        scheduleRefresh(0)
        return
      }
      const anchorResult = result.results.find(
        (item) => item.sequence === requestedSequence && item.offset_segments === 0,
      )
      const nextPrediction =
        anchorResult?.status === 'available' ? (anchorResult.prediction ?? null) : null
      const completedSequence = prediction.value?.segment.sequence ?? -1
      if (
        nextPrediction &&
        shouldPromoteCompletedAnalysis(completedSequence, requestedSequence)
      ) {
        storeBatchInBuffer(result)
        prediction.value = nextPrediction
      }
      predictionHasError.value = false
      predictionMessage.value =
        nextPrediction
          ? playerSegmentSequence.value === requestedSequence
            ? null
            : 'Trecho anterior — atualizando análise.'
          : 'A análise do trecho exibido ainda não está disponível.'
      if (!nextPrediction || requestedSequence < completedSequence) return
      await loadRepresentativeImages(result, signal)
    } catch (error) {
      if (!isCurrentRequest(generation) || signal.aborted) return
      if (predictionErrorCode(error) === 'MODEL_VERSION_MISMATCH') {
        resumeLiveAnalysis()
        clearPredictionBuffer()
        prediction.value = null
        predictionHasError.value = false
        predictionMessage.value = 'O modelo foi atualizado. Sincronizando a nova análise.'
        pendingSegmentRefresh = true
        return
      }
      const failure = predictionFailure(error)
      prediction.value = null
      predictionBatch.value = null
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
      resumeLiveAnalysis()
      clearPredictionBuffer()
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
    predictionHasError.value = false
    predictionMessage.value =
      sequence === null
        ? 'Aguardando a identificação do trecho exibido no player.'
        : prediction.value
          ? 'Trecho anterior — atualizando análise.'
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
    resumeLiveAnalysis()
    clearPredictionBuffer()
    clearPollingTimer()
    cancelRequests()
    document.removeEventListener('visibilitychange', handlePollingAvailability)
    window.removeEventListener('online', handlePollingAvailability)
    window.removeEventListener('offline', handlePollingAvailability)
  })

  return {
    stream,
    prediction: synchronizedPrediction,
    predictionBatch,
    displayedPrediction,
    displayedPredictionBatch,
    analysisPinned,
    pinnedAnalysisIsPrevious,
    displayedAnalysisIsPrevious,
    pinMessage,
    representativeImageUnavailableMessage: REPRESENTATIVE_IMAGE_UNAVAILABLE,
    displayedRepresentativeImage,
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
    pinAnalysis,
    resumeLiveAnalysis,
    changeState,
    uploadSource,
    setPlayerSegmentSequence,
  }
}
