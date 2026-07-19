<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { CameraLocationPicker } from '@/components'
import FloodCameraMonitoringApi from '@/services/FloodCameraMonitoring'
import type {
  AddressAutocompleteKind,
  AddressAutocompleteSuggestion,
  CameraApiItem,
  CameraCreatePayload,
  CityDto,
  NeighborhoodDto,
} from '@/types/camera/camera'
import { parseApiError } from '@/utils/apiError'

const api = new FloodCameraMonitoringApi()
const currentStep = ref<1 | 2 | 3 | 4>(1)
const cities = ref<CityDto[]>([])
const neighborhoods = ref<NeighborhoodDto[]>([])
const loadingTerritory = ref(true)
const loadingNeighborhoods = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)
const resolvingLocation = ref(false)
const resolutionMessage = ref<string | null>(null)
const createdCamera = ref<CameraApiItem | null>(null)
const allowNavigation = ref(false)
const territoryTouched = reactive({ city: false, neighborhood: false })
const addressTouched = reactive({ street: false, number: false, zipcode: false })
const streetSuggestions = ref<AddressAutocompleteSuggestion[]>([])
const addressSuggestions = ref<AddressAutocompleteSuggestion[]>([])
const autocompleteLoading = reactive({ street: false, address: false })
const autocompleteUnavailable = ref(false)
let resolveController: AbortController | null = null
const autocompleteControllers: Partial<Record<AddressAutocompleteKind, AbortController>> = {}
const autocompleteTimers: Partial<Record<AddressAutocompleteKind, ReturnType<typeof setTimeout>>> = {}
let skipNextCityWatch = false

const form = reactive({
  city_id: '',
  neighborhood_id: '',
  street: '',
  number: '',
  state: '',
  country: 'Brasil',
  zipcode: '',
  latitude: null as number | null,
  longitude: null as number | null,
  description: '',
  video_hls: '',
  video_embed: '',
  street_id: null as string | null,
  address_reference_id: null as string | null,
})

function clearAutocomplete(kind?: AddressAutocompleteKind) {
  if (!kind || kind === 'street') streetSuggestions.value = []
  if (!kind || kind === 'address') addressSuggestions.value = []
}

async function runAutocomplete(kind: AddressAutocompleteKind, query: string) {
  autocompleteControllers[kind]?.abort()
  const normalized = query.trim()
  const minimumLength = 2
  if (normalized.length < minimumLength || !form.city_id) {
    clearAutocomplete(kind)
    autocompleteLoading[kind] = false
    return
  }
  const controller = new AbortController()
  autocompleteControllers[kind] = controller
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
    if (autocompleteControllers[kind] === controller) {
      delete autocompleteControllers[kind]
      autocompleteLoading[kind] = false
    }
  }
}

function scheduleAutocomplete(kind: AddressAutocompleteKind, query: string) {
  const timer = autocompleteTimers[kind]
  if (timer) clearTimeout(timer)
  autocompleteTimers[kind] = setTimeout(() => runAutocomplete(kind, query), 350)
}

async function applyTerritoryFromSuggestion(suggestion: AddressAutocompleteSuggestion) {
  if (form.city_id !== suggestion.city_id) {
    skipNextCityWatch = true
    form.city_id = suggestion.city_id
    await loadNeighborhoods(suggestion.city_id)
  }
  if (suggestion.neighborhood_id) {
    const exists = neighborhoods.value.some((item) => item.id === suggestion.neighborhood_id)
    if (exists) form.neighborhood_id = suggestion.neighborhood_id
  }
}

async function chooseSuggestion(suggestion: AddressAutocompleteSuggestion) {
  clearAutocomplete()
  await applyTerritoryFromSuggestion(suggestion)
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
  resolutionMessage.value = `Sugestão “${suggestion.label}” aplicada. Confirme os campos antes de continuar.`
}

function handleStreetInput() {
  addressTouched.street = true
  form.street_id = null
  form.address_reference_id = null
  clearAutocomplete('address')
  scheduleAutocomplete('street', form.street)
}

function handleNumberInput() {
  addressTouched.number = true
  form.address_reference_id = null
  scheduleAutocomplete('address', form.number)
}

function handleZipcodeInput() {
  addressTouched.zipcode = true
  form.address_reference_id = null
}

function handleCoordinateInput(axis: 'latitude' | 'longitude', event: Event) {
  form[axis] = nullableCoordinate(event)
  form.address_reference_id = null
}

const hasUnsavedChanges = computed(
  () =>
    currentStep.value !== 4 &&
    Object.entries(form).some(([key, value]) =>
      key === 'country' ? value !== 'Brasil' : value !== '' && value !== null,
    ),
)

function validUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function nullableCoordinate(event: Event): number | null {
  const raw = (event.target as HTMLInputElement).value.trim()
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

const locationErrors = computed(() => {
  const errors: string[] = []
  if (!form.city_id) errors.push('Selecione a cidade cadastrada.')
  if (!form.neighborhood_id) errors.push('Selecione o bairro correspondente.')
  if (!form.street.trim()) errors.push('Confirme a rua ou logradouro.')
  if (!form.state.trim()) errors.push('Informe o estado.')
  if (!form.country.trim()) errors.push('Informe o país.')
  if (form.latitude === null || form.latitude < -90 || form.latitude > 90)
    errors.push('Informe uma latitude válida.')
  if (form.longitude === null || form.longitude < -180 || form.longitude > 180)
    errors.push('Informe uma longitude válida.')
  return errors
})

const cameraErrors = computed(() => {
  const errors: string[] = []
  if (!form.description.trim()) errors.push('Informe uma descrição para identificar a câmera.')
  if (!validUrl(form.video_hls.trim())) errors.push('Informe uma URL HLS HTTP ou HTTPS válida.')
  if (form.video_embed.trim() && !validUrl(form.video_embed.trim()))
    errors.push('A URL de embed deve usar HTTP ou HTTPS.')
  return errors
})

const selectedCity = computed(() => cities.value.find((city) => city.id === form.city_id) ?? null)
const selectedNeighborhood = computed(
  () => neighborhoods.value.find((item) => item.id === form.neighborhood_id) ?? null,
)

async function loadNeighborhoods(cityId: string) {
  form.neighborhood_id = ''
  neighborhoods.value = []
  if (!cityId) return
  loadingNeighborhoods.value = true
  try {
    neighborhoods.value = await api.getNeighborhoods(cityId)
  } catch {
    errorMessage.value = 'Não foi possível carregar os bairros desta cidade.'
  } finally {
    loadingNeighborhoods.value = false
  }
}

async function handleMapSelection(coordinates: { latitude: number; longitude: number }) {
  form.address_reference_id = null
  resolveController?.abort()
  const controller = new AbortController()
  resolveController = controller
  resolvingLocation.value = true
  resolutionMessage.value = null
  try {
    const result = await api.resolveAddress(
      coordinates.latitude,
      coordinates.longitude,
      controller.signal,
    )
    if (controller.signal.aborted) return
    const resolvedCity = result.city
    const resolvedNeighborhood = result.neighborhood

    if (resolvedCity && !territoryTouched.city && form.city_id !== resolvedCity.id) {
      skipNextCityWatch = true
      form.city_id = resolvedCity.id
      await loadNeighborhoods(resolvedCity.id)
      if (controller.signal.aborted) return
    }

    let candidates = neighborhoods.value
    let match = resolvedNeighborhood
      ? (candidates.find((item) => item.id === resolvedNeighborhood.id) ?? null)
      : null
    if (resolvedNeighborhood && !match && !territoryTouched.city) {
      candidates = await api.getNeighborhoods()
      if (controller.signal.aborted) return
      match = candidates.find((item) => item.id === resolvedNeighborhood.id) ?? null
    }

    if (match && !territoryTouched.city && !form.city_id && match.city_id) {
      skipNextCityWatch = true
      form.city_id = match.city_id
      const matchedNeighborhoodId = match.id
      await loadNeighborhoods(match.city_id)
      match = neighborhoods.value.find((item) => item.id === matchedNeighborhoodId) ?? match
    }
    if (match && !territoryTouched.neighborhood) {
      form.neighborhood_id = match.id
    }

    const nearest = result.nearest_address
    const hasReliableDistance = Boolean(nearest && Number.isFinite(nearest.distance))
    const trustedAddress = Boolean(nearest && hasReliableDistance && nearest.distance <= 50)
    if (nearest && trustedAddress) {
      if (!addressTouched.street) form.street = nearest.street
      if (!addressTouched.number) form.number = nearest.number
      if (!addressTouched.zipcode && nearest.zipcode) form.zipcode = nearest.zipcode
      if (!addressTouched.street) form.street_id = nearest.street_id ?? null
      if (!addressTouched.street && !addressTouched.number)
        form.address_reference_id = nearest.address_reference_id ?? nearest.id
    }

    const territoryMessage = resolvedNeighborhood
      ? form.neighborhood_id === resolvedNeighborhood.id
        ? `Ponto confirmado dentro de ${resolvedNeighborhood.name}.`
        : `O mapa identificou ${resolvedNeighborhood.name}, mas sua seleção manual foi preservada.`
      : 'O ponto não pertence a um bairro disponível no catálogo territorial.'
    if (!nearest) {
      resolutionMessage.value = `${territoryMessage} Confirme o endereço manualmente.`
    } else if (!hasReliableDistance) {
      resolutionMessage.value = `${territoryMessage} O catálogo não informou uma distância confiável; confirme o endereço manualmente.`
    } else if (!trustedAddress) {
      resolutionMessage.value = `${territoryMessage} O endereço mais próximo está a ${Math.round(nearest.distance)} m e não foi aplicado; confirme-o manualmente.`
    } else {
      const preserved = addressTouched.street || addressTouched.number || addressTouched.zipcode
      resolutionMessage.value = `${territoryMessage} Endereço sugerido pelo catálogo a ${Math.round(nearest.distance)} m${preserved ? '; campos editados manualmente foram preservados' : ''}. Confirme antes de continuar.`
    }
  } catch (error: unknown) {
    if (controller.signal.aborted) return
    const parsed = parseApiError(error, 'Não foi possível consultar o catálogo territorial.')
    resolutionMessage.value =
      parsed.status === 401
        ? 'Entre novamente para identificar o bairro pelas coordenadas.'
        : parsed.message
  } finally {
    if (resolveController === controller) {
      resolvingLocation.value = false
      resolveController = null
    }
  }
}

function goToStep(step: 1 | 2 | 3) {
  errorMessage.value = null
  if (step >= 2 && locationErrors.value.length) {
    errorMessage.value = locationErrors.value[0] ?? null
    return
  }
  if (step >= 3 && cameraErrors.value.length) {
    errorMessage.value = cameraErrors.value[0] ?? null
    return
  }
  currentStep.value = step
}

function previousStep() {
  if (currentStep.value === 3) currentStep.value = 2
  else if (currentStep.value === 2) currentStep.value = 1
}

function revisitStep(step: number) {
  if (step === 1 || step === 2 || step === 3) goToStep(step)
}

function buildPayload(): CameraCreatePayload | null {
  if (form.latitude === null || form.longitude === null) return null
  return {
    description: form.description.trim(),
    video_hls: form.video_hls.trim(),
    video_embed: form.video_embed.trim() || null,
    address: {
      city_id: form.city_id,
      neighborhood_id: form.neighborhood_id,
      street: form.street.trim(),
      number: form.number.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      zipcode: form.zipcode.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      street_id: form.street_id,
      address_reference_id: form.address_reference_id,
    },
  }
}

async function submit() {
  const errors = [...locationErrors.value, ...cameraErrors.value]
  if (errors.length) {
    errorMessage.value = errors[0] ?? null
    return
  }
  const payload = buildPayload()
  if (!payload) return
  submitting.value = true
  errorMessage.value = null
  try {
    createdCamera.value = await api.createCamera(payload)
    allowNavigation.value = true
    currentStep.value = 4
  } catch (error: unknown) {
    const parsed = parseApiError(error, 'Não foi possível cadastrar a câmera.')
    if (parsed.status === 409) {
      errorMessage.value = 'Já existe uma câmera cadastrada com esta URL HLS.'
    } else if (parsed.status === 401) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente para concluir o cadastro.'
    } else if (parsed.status === 403) {
      errorMessage.value = 'Apenas administradores podem cadastrar câmeras.'
    } else {
      errorMessage.value = parsed.message
    }
  } finally {
    submitting.value = false
  }
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value || allowNavigation.value) return
  event.preventDefault()
  event.returnValue = ''
}

watch(
  () => form.city_id,
  (cityId) => {
    const city = cities.value.find((item) => item.id === cityId)
    if (city?.state && !form.state) form.state = city.state
    if (skipNextCityWatch) {
      skipNextCityWatch = false
      return
    }
    form.street_id = null
    form.address_reference_id = null
    clearAutocomplete()
    loadNeighborhoods(cityId)
  },
)

watch(
  () => form.neighborhood_id,
  () => {
    clearAutocomplete()
    if (territoryTouched.neighborhood) {
      form.street_id = null
      form.address_reference_id = null
    }
  },
)

onMounted(async () => {
  try {
    cities.value = await api.getCities()
  } catch {
    errorMessage.value = 'Não foi possível carregar as cidades cadastradas.'
  } finally {
    loadingTerritory.value = false
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  resolveController?.abort()
  Object.values(autocompleteControllers).forEach((controller) => controller?.abort())
  Object.values(autocompleteTimers).forEach((timer) => timer && clearTimeout(timer))
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
onBeforeRouteLeave(() => {
  if (allowNavigation.value || !hasUnsavedChanges.value) return true
  return window.confirm('Há alterações não salvas neste cadastro. Deseja sair mesmo assim?')
})
</script>

<template>
  <section class="mx-auto mt-5 w-full max-w-7xl px-4 dark:text-white md:px-0">
    <header>
      <p class="text-xs font-semibold tracking-[0.18em] text-[#2768CA] uppercase">
        Administração · câmeras
      </p>
      <h1 class="mt-1 text-2xl font-semibold md:text-3xl">Cadastrar nova câmera</h1>
      <p class="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
        Associe a câmera a um endereço confirmado. O cadastro será criado inativo e não abrirá a
        transmissão nem executará análise.
      </p>
    </header>

    <ol class="mt-6 grid grid-cols-4 gap-2" aria-label="Etapas do cadastro">
      <li v-for="step in 4" :key="step">
        <button
          type="button"
          class="flex w-full items-center gap-2 text-left"
          :disabled="step === 4 || step > currentStep"
          :aria-current="currentStep === step ? 'step' : undefined"
          @click="step < currentStep && step < 4 ? revisitStep(step) : undefined"
        >
          <span
            class="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold"
            :class="
              currentStep >= step
                ? 'bg-[#2768CA] text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-[#071F36]'
            "
          >
            <span v-if="currentStep > step" class="material-symbols-outlined text-lg">check</span
            ><span v-else>{{ step }}</span>
          </span>
          <span class="hidden text-xs font-semibold sm:block">{{
            step === 1 ? 'Localização' : step === 2 ? 'Dados' : step === 3 ? 'Revisão' : 'Conclusão'
          }}</span>
        </button>
        <div class="mt-2 h-1 rounded-full bg-slate-100 dark:bg-[#071F36]">
          <div v-if="currentStep >= step" class="h-full rounded-full bg-[#2768CA]"></div>
        </div>
      </li>
    </ol>

    <div
      v-if="errorMessage"
      role="alert"
      class="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="currentStep === 1"
      class="mt-6 grid gap-6 xl:grid-cols-[minmax(340px,0.72fr)_minmax(560px,1.28fr)]"
    >
      <div
        class="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#00182F]"
      >
        <h2 class="text-xl font-semibold">1. Confirme a localização</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A busca do mapa auxilia o preenchimento; os campos abaixo são a confirmação
          administrativa.
        </p>
        <div
          class="mt-5 grid gap-4 sm:grid-cols-2 [&>label]:min-w-0 [&_input]:w-full [&_input]:min-w-0 [&_select]:w-full [&_select]:min-w-0"
        >
          <label class="grid gap-1 text-sm font-semibold sm:col-span-2"
            >Cidade
            <select
              v-model="form.city_id"
              class="min-h-12 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
              :disabled="loadingTerritory"
              @change="territoryTouched.city = true"
            >
              <option value="">{{ loadingTerritory ? 'Carregando...' : 'Selecione' }}</option>
              <option v-for="city in cities" :key="city.id" :value="city.id">
                {{ city.name }}
              </option>
            </select>
          </label>
          <label class="grid gap-1 text-sm font-semibold sm:col-span-2"
>Bairro
            <select
              v-model="form.neighborhood_id"
              class="min-h-12 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
              :disabled="!form.city_id || loadingNeighborhoods"
@change="territoryTouched.neighborhood = true"
            >
              <option value="">{{ loadingNeighborhoods ? 'Carregando...' : 'Selecione' }}</option>
              <option v-for="item in neighborhoods" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </label>
          <label class="relative grid gap-1 text-sm font-semibold sm:col-span-2"
            >Rua ou logradouro<input
              v-model="form.street"
              role="combobox"
              aria-autocomplete="list"
              :aria-expanded="streetSuggestions.length > 0"
              aria-controls="camera-street-suggestions"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
              autocomplete="street-address"
@input="handleStreetInput"
              @keydown.escape="clearAutocomplete('street')"
            />
            <span v-if="autocompleteLoading.street" class="absolute right-3 bottom-4 text-xs font-normal text-slate-500">Buscando…</span>
            <ul v-if="streetSuggestions.length" id="camera-street-suggestions" role="listbox" class="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
              <li v-for="suggestion in streetSuggestions" :key="suggestion.id" role="option">
                <button type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm font-normal hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none" @click="chooseSuggestion(suggestion)">{{ suggestion.label }}</button>
              </li>
            </ul>
          </label>
          <label class="relative grid gap-1 text-sm font-semibold"
            >Número<input
              v-model="form.number"
              role="combobox"
              aria-autocomplete="list"
              :aria-expanded="addressSuggestions.length > 0"
              aria-controls="camera-address-suggestions"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
              @input="handleNumberInput"
              @keydown.escape="clearAutocomplete('address')"
            />
            <span v-if="autocompleteLoading.address" class="absolute right-3 bottom-4 text-xs font-normal text-slate-500">…</span>
            <ul v-if="addressSuggestions.length" id="camera-address-suggestions" role="listbox" class="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 min-w-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
              <li v-for="suggestion in addressSuggestions" :key="suggestion.id" role="option">
                <button type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm font-normal hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none" @click="chooseSuggestion(suggestion)">{{ suggestion.label }}</button>
              </li>
            </ul>
          </label>
          <label class="grid gap-1 text-sm font-semibold"
>CEP<input
              v-model="form.zipcode"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
              autocomplete="postal-code"
              @input="handleZipcodeInput"
          /></label>
          <label class="grid gap-1 text-sm font-semibold"
>Estado<input
              v-model="form.state"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal uppercase dark:border-slate-600"
              maxlength="80"
          /></label>
          <label class="grid gap-1 text-sm font-semibold"
            >País<input
              v-model="form.country"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
              autocomplete="country-name"
          /></label>
          <label class="grid gap-1 text-sm font-semibold"
            >Latitude<input
              :value="form.latitude ?? ''"
              type="number"
              step="any"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
              @input="handleCoordinateInput('latitude', $event)"
          /></label>
          <label class="grid gap-1 text-sm font-semibold"
            >Longitude<input
              :value="form.longitude ?? ''"
              type="number"
              step="any"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
              @input="handleCoordinateInput('longitude', $event)"
          /></label>
        </div>
        <p v-if="autocompleteUnavailable" class="mt-3 text-sm text-amber-700 dark:text-amber-300" role="status">
          O autocomplete territorial está indisponível. Continue preenchendo os campos manualmente.
        </p>
      </div>
      <div>
        <CameraLocationPicker
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          :city-id="form.city_id"
          :neighborhood-id="form.neighborhood_id"
          @selected="handleMapSelection"
          @suggestion-selected="chooseSuggestion"
        />
        <p class="mt-3 min-h-6 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
          {{ resolvingLocation ? 'Consultando o catálogo territorial...' : resolutionMessage }}
        </p>
      </div>
    </div>

    <div
      v-else-if="currentStep === 2"
      class="mx-auto mt-6 max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-700 dark:bg-[#00182F]"
    >
      <h2 class="text-xl font-semibold">2. Dados da câmera</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        As URLs são armazenadas somente após o envio. O formulário não tenta acessá-las.
      </p>
      <div class="mt-6 grid gap-5">
        <label class="grid gap-1 text-sm font-semibold"
          >Descrição<input
            v-model="form.description"
            class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
            placeholder="Ex.: Câmera da Rua das Palmeiras"
        /></label>
        <label class="grid gap-1 text-sm font-semibold"
          >URL HLS<input
            v-model="form.video_hls"
            type="url"
            class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
            placeholder="https://…/stream.m3u8"
            autocomplete="off"
        /></label>
        <label class="grid gap-1 text-sm font-semibold"
          >URL de embed <span class="font-normal text-slate-500">(opcional)</span
          ><input
            v-model="form.video_embed"
            type="url"
            class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
            placeholder="https://…"
            autocomplete="off"
        /></label>
      </div>
    </div>

    <div
      v-else-if="currentStep === 3"
      class="mx-auto mt-6 max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-700 dark:bg-[#00182F]"
    >
      <h2 class="text-xl font-semibold">3. Revise antes de cadastrar</h2>
      <div
        class="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
      >
        <strong>Criação inativa:</strong> a câmera não será ativada nem analisada automaticamente.
        Uma validação operacional posterior será necessária.
      </div>
      <dl class="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-slate-500">Câmera</dt>
          <dd class="font-semibold">{{ form.description }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Cidade e bairro</dt>
          <dd class="font-semibold">{{ selectedCity?.name }} · {{ selectedNeighborhood?.name }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Endereço</dt>
          <dd class="font-semibold">
            {{ form.street }}<span v-if="form.number">, {{ form.number }}</span>
          </dd>
        </div>
        <div>
          <dt class="text-slate-500">Coordenadas</dt>
          <dd class="font-semibold">{{ form.latitude }}, {{ form.longitude }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-slate-500">HLS</dt>
          <dd class="break-all font-semibold">{{ form.video_hls }}</dd>
        </div>
        <div v-if="form.video_embed" class="sm:col-span-2">
          <dt class="text-slate-500">Embed</dt>
          <dd class="break-all font-semibold">{{ form.video_embed }}</dd>
        </div>
      </dl>
    </div>

    <div
      v-else
      class="mx-auto mt-8 max-w-2xl rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
    >
      <span class="material-symbols-outlined text-6xl" aria-hidden="true">check_circle</span>
      <h2 class="mt-3 text-2xl font-semibold">Câmera cadastrada</h2>
      <p class="mt-2">
        O registro foi criado inativo. Valide a transmissão e as permissões antes de solicitar sua
        ativação.
      </p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <RouterLink
          to="/admin"
          class="min-h-12 rounded-xl border border-emerald-700 px-5 py-3 font-semibold"
          >Voltar à administração</RouterLink
        ><RouterLink
          v-if="createdCamera"
          :to="`/cameras/${createdCamera.id}`"
          class="min-h-12 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white"
          >Ver cadastro</RouterLink
        >
      </div>
    </div>

    <div v-if="currentStep < 4" class="mt-6 flex items-center justify-between gap-3 pb-10">
      <button
        type="button"
        class="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold disabled:opacity-40 dark:border-slate-600"
        :disabled="currentStep === 1"
        @click="previousStep"
      >
        Voltar
      </button>
      <button
        v-if="currentStep === 1"
        type="button"
        class="min-h-12 rounded-xl bg-[#2768CA] px-6 font-semibold text-white"
        @click="goToStep(2)"
      >
        Continuar
      </button>
      <button
        v-else-if="currentStep === 2"
        type="button"
        class="min-h-12 rounded-xl bg-[#2768CA] px-6 font-semibold text-white"
        @click="goToStep(3)"
      >
        Revisar
      </button>
      <button
        v-else
        type="button"
        class="min-h-12 rounded-xl bg-[#2768CA] px-6 font-semibold text-white disabled:opacity-60"
        :disabled="submitting"
        @click="submit"
      >
        {{ submitting ? 'Cadastrando...' : 'Cadastrar câmera' }}
      </button>
    </div>
  </section>
</template>
