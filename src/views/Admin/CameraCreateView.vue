<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { FloodCameraMonitoringApi } from '@/modules/cameras'
import type { CameraApiItem, CityDto, NeighborhoodDto } from '@/modules/cameras'
import type { CameraCreateStep, MapCoordinates } from '@/modules/cameras'
import { parseApiError } from '@/utils/apiError'
import { CameraCreateActions } from '@/modules/cameras'
import { CameraCreateProgress } from '@/modules/cameras'
import { CameraCreateSuccess } from '@/modules/cameras'
import { CameraDataStep } from '@/modules/cameras'
import { CameraLocationStep } from '@/modules/cameras'
import { CameraReviewStep } from '@/modules/cameras'
import { useAddressAutocomplete } from '@/modules/cameras'
import { useCameraCreateForm } from '@/modules/cameras'
import { useCameraTerritory } from '@/modules/cameras'
import { useUnsavedCameraGuard } from '@/modules/cameras'

const api = new FloodCameraMonitoringApi()
const currentStep = ref<CameraCreateStep>(1)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)
const createdCamera = ref<CameraApiItem | null>(null)
const allowNavigation = ref(false)

const {
  form,
  locationErrors,
  cameraErrors,
  setCoordinateFromEvent,
  buildPayload,
} = useCameraCreateForm()

const {
  cities,
  neighborhoods,
  loadingTerritory,
  loadingNeighborhoods,
  resolvingLocation,
  resolutionMessage,
  loadCities,
  handleManualCityChange: changeCityManually,
  applyTerritoryFromSuggestion,
  resolveMapSelection,
} = useCameraTerritory(api, form, {
  errorMessage,
})

const {
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
} = useAddressAutocomplete(api, form, {
  applyTerritoryFromSuggestion,
  setResolutionMessage(message: string | null) {
    resolutionMessage.value = message
  },
})

useUnsavedCameraGuard(form, currentStep, allowNavigation)

const selectedCity = computed(
  () => cities.value.find((city: CityDto) => city.id === form.city_id) ?? null,
)

const selectedNeighborhood = computed(
  () =>
    neighborhoods.value.find((item: NeighborhoodDto) => item.id === form.neighborhood_id) ?? null,
)

async function handleManualCityChange() {
  cancelAutocomplete()
  await changeCityManually()
}

async function handleMapSelection(coordinates: MapCoordinates) {
  cancelAutocomplete()
  await resolveMapSelection(coordinates)
}

function validateUntil(step: 1 | 2 | 3) {
  if (step >= 2 && locationErrors.value.length) {
    errorMessage.value = locationErrors.value[0] ?? null
    return false
  }

  if (step >= 3 && cameraErrors.value.length) {
    errorMessage.value = cameraErrors.value[0] ?? null
    return false
  }

  return true
}

function goToStep(step: 1 | 2 | 3) {
  errorMessage.value = null
  if (!validateUntil(step)) return
  currentStep.value = step
}

function nextStep() {
  if (currentStep.value === 1) goToStep(2)
  else if (currentStep.value === 2) goToStep(3)
}

function previousStep() {
  if (currentStep.value === 3) currentStep.value = 2
  else if (currentStep.value === 2) currentStep.value = 1
}

function updateForm(nextForm: typeof form) {
  Object.assign(form, nextForm)
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

onMounted(() => {
  void loadCities()
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

    <CameraCreateProgress :current-step="currentStep" @navigate="goToStep" />

    <div
      v-if="errorMessage"
      role="alert"
      class="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      {{ errorMessage }}
    </div>

    <CameraLocationStep
      v-if="currentStep === 1"
      :form="form"
      :cities="cities"
      :neighborhoods="neighborhoods"
      :loading-territory="loadingTerritory"
      :loading-neighborhoods="loadingNeighborhoods"
      :resolving-location="resolvingLocation"
      :resolution-message="resolutionMessage"
      :street-suggestions="streetSuggestions"
      :address-suggestions="addressSuggestions"
      :autocomplete-loading="autocompleteLoading"
      :autocomplete-unavailable="autocompleteUnavailable"
      @update:form="updateForm"
      @city-change="handleManualCityChange"
      @street-input="handleStreetInput"
      @number-input="handleNumberInput"
      @zipcode-input="handleZipcodeInput"
      @coordinate-input="setCoordinateFromEvent"
      @map-selected="handleMapSelection"
      @suggestion-selected="chooseSuggestion"
      @clear-autocomplete="clearAutocomplete"
    />

    <CameraDataStep v-else-if="currentStep === 2" :form="form" @update:form="updateForm" />

    <CameraReviewStep
      v-else-if="currentStep === 3"
      :form="form"
      :selected-city="selectedCity"
      :selected-neighborhood="selectedNeighborhood"
    />

    <CameraCreateSuccess v-else :camera="createdCamera" />

    <CameraCreateActions
      :current-step="currentStep"
      :submitting="submitting"
      @previous="previousStep"
      @next="nextStep"
      @submit="submit"
    />
  </section>
</template>
