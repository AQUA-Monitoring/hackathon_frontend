import { onBeforeUnmount, reactive, ref } from 'vue'
import FloodCameraMonitoringApi from '../FloodCameraMonitoringApi'
import type {
  AddressAutocompleteKind,
  AddressAutocompleteSuggestion,
} from '../types/camera'
import type { CameraCreateFormState } from '../types/cameraCreate'

interface AddressAutocompleteOptions {
  applyTerritoryFromSuggestion: (
    suggestion: AddressAutocompleteSuggestion,
  ) => Promise<void>
  setResolutionMessage: (message: string | null) => void
}

export function useAddressAutocomplete(
  api: FloodCameraMonitoringApi,
  form: CameraCreateFormState,
  options: AddressAutocompleteOptions,
) {
  const streetSuggestions = ref<AddressAutocompleteSuggestion[]>([])
  const addressSuggestions = ref<AddressAutocompleteSuggestion[]>([])
  const autocompleteLoading = reactive({ street: false, address: false })
  const autocompleteUnavailable = ref(false)

  const controllers: Partial<Record<AddressAutocompleteKind, AbortController>> = {}
  const timers: Partial<
    Record<AddressAutocompleteKind, ReturnType<typeof setTimeout>>
  > = {}

  function clearAutocomplete(kind?: AddressAutocompleteKind) {
    if (!kind || kind === 'street') streetSuggestions.value = []
    if (!kind || kind === 'address') addressSuggestions.value = []
  }

  async function runAutocomplete(kind: AddressAutocompleteKind, query: string) {
    controllers[kind]?.abort()

    const normalized = query.trim()
    if (normalized.length < 2 || !form.city_id) {
      clearAutocomplete(kind)
      autocompleteLoading[kind] = false
      return
    }

    const controller = new AbortController()
    controllers[kind] = controller
    autocompleteLoading[kind] = true
    autocompleteUnavailable.value = false

    try {
      const suggestions = await api.autocompleteAddress(
        {
          kind,
          q: normalized,
          city_id: form.city_id,
          neighborhood_id: form.neighborhood_id || undefined,
          street_id: kind === 'address' ? form.street_id || undefined : undefined,
        },
        controller.signal,
      )

      if (kind === 'street') streetSuggestions.value = suggestions
      else addressSuggestions.value = suggestions
    } catch {
      if (!controller.signal.aborted) {
        clearAutocomplete(kind)
        autocompleteUnavailable.value = true
      }
    } finally {
      if (controllers[kind] === controller) {
        delete controllers[kind]
        autocompleteLoading[kind] = false
      }
    }
  }

  function scheduleAutocomplete(kind: AddressAutocompleteKind, query: string) {
    const previousTimer = timers[kind]
    if (previousTimer) clearTimeout(previousTimer)

    timers[kind] = setTimeout(() => {
      void runAutocomplete(kind, query)
    }, 350)
  }

  async function chooseSuggestion(suggestion: AddressAutocompleteSuggestion) {
    clearAutocomplete()
    await options.applyTerritoryFromSuggestion(suggestion)

    form.street = suggestion.street
    form.street_id = suggestion.street_id

    if (suggestion.kind === 'address') {
      form.number = suggestion.number ?? form.number
      form.zipcode = suggestion.zipcode ?? form.zipcode
      form.address_reference_id = suggestion.address_reference_id
    } else {
      form.address_reference_id = null
    }

    if (suggestion.latitude !== null && suggestion.longitude !== null) {
      form.latitude = suggestion.latitude
      form.longitude = suggestion.longitude
    }

    options.setResolutionMessage(
      `Sugestão “${suggestion.label}” aplicada. Você pode corrigir os campos manualmente.`,
    )
  }

  function handleStreetInput() {
    form.street_id = null
    form.address_reference_id = null
    clearAutocomplete('address')
    scheduleAutocomplete('street', form.street)
  }

  function handleNumberInput() {
    form.address_reference_id = null
    scheduleAutocomplete('address', form.number)
  }

  function handleZipcodeInput() {
    form.address_reference_id = null
  }

  function cancelAutocomplete() {
    Object.values(controllers).forEach((controller) => controller?.abort())
    Object.values(timers).forEach((timer) => timer && clearTimeout(timer))
    clearAutocomplete()
  }

  onBeforeUnmount(cancelAutocomplete)

  return {
    streetSuggestions,
    addressSuggestions,
    autocompleteLoading,
    autocompleteUnavailable,
    clearAutocomplete,
    chooseSuggestion,
    handleStreetInput,
    handleNumberInput,
    handleZipcodeInput,
    cancelAutocomplete,
  }
}
