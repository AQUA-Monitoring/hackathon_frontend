import { onBeforeUnmount, ref, type Ref } from 'vue'
import FloodCameraMonitoringApi from '@/services/FloodCameraMonitoring'
import type {
  AddressAutocompleteSuggestion,
  CityDto,
  NeighborhoodDto,
} from '@/types/camera/camera'
import type { CameraCreateFormState, MapCoordinates } from '@/types/cameraCreate'
import { parseApiError } from '@/utils/apiError'

interface TerritoryOptions {
  errorMessage: Ref<string | null>
}

function normalizeName(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function useCameraTerritory(
  api: FloodCameraMonitoringApi,
  form: CameraCreateFormState,
  options: TerritoryOptions,
) {
  const cities = ref<CityDto[]>([])
  const neighborhoods = ref<NeighborhoodDto[]>([])
  const loadingTerritory = ref(true)
  const loadingNeighborhoods = ref(false)
  const resolvingLocation = ref(false)
  const resolutionMessage = ref<string | null>(null)

  let resolveController: AbortController | null = null
  let territorySequence = 0

  function operationIsCurrent(sequence: number) {
    return sequence === territorySequence
  }

  function cancelPendingTerritoryOperation() {
    territorySequence += 1
    resolveController?.abort()
    resolveController = null
    resolvingLocation.value = false
  }

  function setStateFromCity(cityId: string) {
    const city = cities.value.find((item) => String(item.id) === String(cityId))
    if (city?.state) form.state = city.state
  }

  async function loadCities() {
    loadingTerritory.value = true

    try {
      cities.value = await api.getCities()
    } catch {
      options.errorMessage.value = 'Não foi possível carregar as cidades cadastradas.'
    } finally {
      loadingTerritory.value = false
    }
  }

  async function loadNeighborhoodsForOperation(cityId: string, sequence: number) {
    if (!cityId) {
      if (operationIsCurrent(sequence)) {
        neighborhoods.value = []
        form.neighborhood_id = ''
        loadingNeighborhoods.value = false
      }
      return [] as NeighborhoodDto[]
    }

    loadingNeighborhoods.value = true

    try {
      const loaded = await api.getNeighborhoods(cityId)
      if (!operationIsCurrent(sequence)) return []

      neighborhoods.value = loaded
      return loaded
    } catch {
      if (operationIsCurrent(sequence)) {
        neighborhoods.value = []
        form.neighborhood_id = ''
        options.errorMessage.value = 'Não foi possível carregar os bairros desta cidade.'
      }
      return []
    } finally {
      if (operationIsCurrent(sequence)) {
        loadingNeighborhoods.value = false
      }
    }
  }

  function clearAddressForNewMapPoint() {
    form.street = ''
    form.number = ''
    form.zipcode = ''
    form.street_id = null
    form.address_reference_id = null
  }

  function applyNearestAddress(
    nearest: Awaited<ReturnType<FloodCameraMonitoringApi['resolveAddress']>>['nearest_address'],
  ) {
    const hasReliableDistance = Boolean(nearest && Number.isFinite(nearest.distance))
    const trustedAddress = Boolean(nearest && hasReliableDistance && nearest.distance <= 50)

    if (!nearest || !trustedAddress) {
      clearAddressForNewMapPoint()
      return {
        nearest,
        hasReliableDistance,
        trustedAddress,
      }
    }

    form.street = nearest.street
    form.number = nearest.number
    form.zipcode = nearest.zipcode ?? ''
    form.street_id = nearest.street_id ?? null
    form.address_reference_id = nearest.address_reference_id ?? nearest.id

    return {
      nearest,
      hasReliableDistance,
      trustedAddress,
    }
  }

  async function handleManualCityChange() {
    cancelPendingTerritoryOperation()
    const sequence = territorySequence

    options.errorMessage.value = null
    resolutionMessage.value = null
    form.neighborhood_id = ''
    form.street_id = null
    form.address_reference_id = null

    setStateFromCity(form.city_id)
    await loadNeighborhoodsForOperation(form.city_id, sequence)
  }

  async function applyTerritoryFromSuggestion(suggestion: AddressAutocompleteSuggestion) {
    cancelPendingTerritoryOperation()
    const sequence = territorySequence

    options.errorMessage.value = null
    resolutionMessage.value = null

    form.city_id = suggestion.city_id
    form.neighborhood_id = ''
    setStateFromCity(suggestion.city_id)

    const loaded = await loadNeighborhoodsForOperation(suggestion.city_id, sequence)
    if (!operationIsCurrent(sequence)) return

    if (suggestion.neighborhood_id) {
      const match = loaded.find(
        (item) => String(item.id) === String(suggestion.neighborhood_id),
      )
      form.neighborhood_id = match?.id ?? ''
    }
  }

  async function resolveMapSelection(coordinates: MapCoordinates) {
    cancelPendingTerritoryOperation()
    const sequence = territorySequence

    const controller = new AbortController()
    resolveController = controller
    resolvingLocation.value = true
    resolutionMessage.value = null
    options.errorMessage.value = null

    /*
     * Um novo clique no mapa passa a ser a fonte de verdade da localização.
     * Dados territoriais e endereço anteriores são removidos imediatamente.
     */
    form.latitude = coordinates.latitude
    form.longitude = coordinates.longitude
    form.city_id = ''
    form.neighborhood_id = ''
    form.state = ''
    neighborhoods.value = []
    clearAddressForNewMapPoint()

    try {
      const result = await api.resolveAddress(
        coordinates.latitude,
        coordinates.longitude,
        controller.signal,
      )

      if (controller.signal.aborted || !operationIsCurrent(sequence)) return

      const resolvedCity = result.city
      const resolvedNeighborhood = result.neighborhood
      const cityId = resolvedCity?.id ?? resolvedNeighborhood?.city_id ?? null

      if (cityId) {
        form.city_id = cityId
        form.state = resolvedCity?.state ?? ''
        if (!form.state) setStateFromCity(cityId)
      }

      let matchedNeighborhood: NeighborhoodDto | null = null

      if (cityId) {
        const loaded = await loadNeighborhoodsForOperation(cityId, sequence)
        if (controller.signal.aborted || !operationIsCurrent(sequence)) return

        if (resolvedNeighborhood) {
          matchedNeighborhood =
            loaded.find(
              (item) => String(item.id) === String(resolvedNeighborhood.id),
            ) ??
            loaded.find(
              (item) => normalizeName(item.name) === normalizeName(resolvedNeighborhood.name),
            ) ??
            null
        }

        form.neighborhood_id = matchedNeighborhood?.id ?? ''
      }

      const addressResult = applyNearestAddress(result.nearest_address)
      const nearest = addressResult.nearest

      const territoryMessage = resolvedNeighborhood
        ? matchedNeighborhood
          ? `Ponto confirmado dentro de ${matchedNeighborhood.name}.`
          : `O mapa identificou ${resolvedNeighborhood.name}, mas o bairro não foi encontrado no catálogo da cidade.`
        : 'O ponto não pertence a um bairro disponível no catálogo territorial.'

      if (!nearest) {
        resolutionMessage.value = `${territoryMessage} Preencha o endereço manualmente.`
      } else if (!addressResult.hasReliableDistance) {
        resolutionMessage.value = `${territoryMessage} O catálogo não informou uma distância confiável; preencha o endereço manualmente.`
      } else if (!addressResult.trustedAddress) {
        resolutionMessage.value = `${territoryMessage} O endereço mais próximo está a ${Math.round(nearest.distance)} m e não foi aplicado.`
      } else {
        resolutionMessage.value = `${territoryMessage} Endereço sugerido pelo catálogo a ${Math.round(nearest.distance)} m. Você pode corrigir qualquer campo manualmente.`
      }
    } catch (error: unknown) {
      if (controller.signal.aborted || !operationIsCurrent(sequence)) return

      const parsed = parseApiError(
        error,
        'Não foi possível consultar o catálogo territorial.',
      )

      resolutionMessage.value =
        parsed.status === 401
          ? 'Entre novamente para identificar o bairro pelas coordenadas.'
          : parsed.message
    } finally {
      if (resolveController === controller) {
        resolveController = null
      }

      if (operationIsCurrent(sequence)) {
        resolvingLocation.value = false
      }
    }
  }

  onBeforeUnmount(() => {
    cancelPendingTerritoryOperation()
  })

  return {
    cities,
    neighborhoods,
    loadingTerritory,
    loadingNeighborhoods,
    resolvingLocation,
    resolutionMessage,
    loadCities,
    handleManualCityChange,
    applyTerritoryFromSuggestion,
    resolveMapSelection,
  }
}
