<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CameraLocationStep,
  FloodCameraMonitoringApi,
  useAddressAutocomplete,
  useCameraCreateForm,
  useCameraTerritory,
} from '@/modules/cameras'
import type { CameraApiItem, CameraUpdatePayload, MapCoordinates } from '@/modules/cameras'
import { parseApiError } from '@/shared'

const props = defineProps<{ id: string }>()
const route = useRoute()
const router = useRouter()
const api = new FloodCameraMonitoringApi()
const camera = ref<CameraApiItem | null>(null)
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref<string | null>(null)

const { form, locationErrors, setCoordinateFromEvent } = useCameraCreateForm()
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
} = useCameraTerritory(api, form, { errorMessage })
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
  setResolutionMessage(message) {
    resolutionMessage.value = message
  },
})

const currentAddress = computed(() => {
  const address = camera.value?.address
  if (!address) return 'Endereço atual não informado'
  return [address.street, address.number, address.neighborhood?.name, address.city]
    .filter(Boolean)
    .join(' · ')
})
const returnTo = computed(() => {
  const candidate = typeof route.query.return_to === 'string' ? route.query.return_to : ''
  return /^\/admin\/cameras(?:\?|$)/.test(candidate) ? candidate : '/admin/cameras'
})

function updateForm(nextForm: typeof form) {
  Object.assign(form, nextForm)
}

async function handleManualCityChange() {
  cancelAutocomplete()
  await changeCityManually()
}

async function handleMapSelection(coordinates: MapCoordinates) {
  cancelAutocomplete()
  await resolveMapSelection(coordinates)
}

function addressPayload(): CameraUpdatePayload['address'] | null {
  if (form.latitude === null || form.longitude === null) return null
  return {
    city_id: form.city_id,
    neighborhood_id: form.neighborhood_id,
    street: form.street.trim(),
    number: form.number.trim(),
    state: form.state.trim() || 'SC',
    country: form.country.trim() || 'Brasil',
    zipcode: form.zipcode.trim(),
    latitude: form.latitude,
    longitude: form.longitude,
    street_id: form.address_reference_id ? null : form.street_id,
    address_reference_id: form.address_reference_id,
  }
}

async function save() {
  const error = locationErrors.value[0]
  const address = addressPayload()
  if (error || !address) {
    errorMessage.value = error ?? 'Selecione uma localização válida no mapa.'
    return
  }
  saving.value = true
  errorMessage.value = null
  try {
    await api.updateCamera(props.id, { address })
    await router.push(returnTo.value)
  } catch (caught) {
    errorMessage.value = parseApiError(
      caught,
      'Não foi possível atualizar a localização da câmera.',
    ).message
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await loadCities()
    camera.value = await api.getCamera(props.id)
    const address = camera.value.address
    const neighborhoodId = address?.neighborhood?.id ?? ''
    Object.assign(form, {
      city_id: address?.city_ref?.id ?? '',
      neighborhood_id: '',
      street: address?.street ?? '',
      number: address?.number ?? '',
      state: address?.state || 'SC',
      country: address?.country || 'Brasil',
      zipcode: address?.zipcode ?? '',
      latitude: address?.latitude ?? camera.value.latitude ?? null,
      longitude: address?.longitude ?? camera.value.longitude ?? null,
      description: camera.value.description,
      video_hls: camera.value.video_hls ?? '',
      video_embed: camera.value.video_embed ?? '',
      street_id: null,
      address_reference_id: null,
    })
    if (form.city_id) {
      await changeCityManually()
      if (neighborhoods.value.some((item) => item.id === neighborhoodId)) {
        form.neighborhood_id = neighborhoodId
      }
    }
  } catch (caught) {
    errorMessage.value = parseApiError(
      caught,
      'Não foi possível carregar a localização da câmera.',
    ).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-4 py-6 dark:text-white lg:px-0">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold tracking-[0.18em] text-[#2768CA] uppercase">
          Administração · câmeras
        </p>
        <h1 class="mt-1 text-2xl font-semibold md:text-3xl">Alterar localização da câmera</h1>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ currentAddress }}</p>
      </div>
      <RouterLink
        :to="returnTo"
        class="rounded-xl border border-slate-300 px-4 py-2 font-semibold dark:border-slate-600"
      >
        Voltar
      </RouterLink>
    </header>

    <div
      v-if="errorMessage"
      role="alert"
      class="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="grid min-h-80 place-items-center text-slate-500" role="status">
      Carregando localização...
    </div>

    <template v-else-if="camera">
      <CameraLocationStep
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

      <div class="mt-6 flex justify-end gap-3">
        <RouterLink
          :to="returnTo"
          class="rounded-xl px-4 py-3 font-semibold text-slate-700 dark:text-slate-200"
        >
          Cancelar
        </RouterLink>
        <button
          type="button"
          class="rounded-xl bg-[#0453AF] px-5 py-3 font-semibold text-white disabled:opacity-60"
          :disabled="saving || resolvingLocation"
          @click="save"
        >
          {{ saving ? 'Salvando...' : 'Salvar nova localização' }}
        </button>
      </div>
    </template>
  </section>
</template>
