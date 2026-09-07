<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CameraLocationPicker from '../CameraLocationPicker.vue'
import type {
  AddressAutocompleteKind,
  AddressAutocompleteSuggestion,
  CityDto,
  NeighborhoodDto,
} from '../../types/camera'
import type { CameraCreateFormState, MapCoordinates } from '../../types/cameraCreate'

const props = defineProps<{
  form: CameraCreateFormState
  cities: CityDto[]
  neighborhoods: NeighborhoodDto[]
  loadingTerritory: boolean
  loadingNeighborhoods: boolean
  resolvingLocation: boolean
  resolutionMessage: string | null
  streetSuggestions: AddressAutocompleteSuggestion[]
  addressSuggestions: AddressAutocompleteSuggestion[]
  autocompleteLoading: Record<AddressAutocompleteKind, boolean>
  autocompleteUnavailable: boolean
  allowMissingNeighborhood?: boolean
}>()

const emit = defineEmits<{
  'update:form': [form: CameraCreateFormState]
  cityChange: []
  streetInput: []
  numberInput: []
  zipcodeInput: []
  coordinateInput: [axis: 'latitude' | 'longitude', event: Event]
  mapSelected: [coordinates: MapCoordinates]
  suggestionSelected: [suggestion: AddressAutocompleteSuggestion]
  clearAutocomplete: [kind: AddressAutocompleteKind]
}>()

function updateForm(patch: Partial<CameraCreateFormState>) {
  emit('update:form', { ...props.form, ...patch })
}

function handleCityChange(event: Event) {
  updateForm({ city_id: (event.target as HTMLSelectElement).value })
  emit('cityChange')
}

function handleStreetFieldInput(event: Event) {
  updateForm({ street: (event.target as HTMLInputElement).value })
  emit('streetInput')
}

function handleNumberFieldInput(event: Event) {
  updateForm({ number: (event.target as HTMLInputElement).value })
  emit('numberInput')
}

const neighborhoodQuery = ref('')
const neighborhoodOpen = ref(false)
const selectedNeighborhood = computed(() =>
  props.neighborhoods.find((item) => item.id === props.form.neighborhood_id),
)
const filteredNeighborhoods = computed(() => {
  const query = neighborhoodQuery.value.trim().toLocaleLowerCase('pt-BR')
  if (!query) return props.neighborhoods.slice(0, 12)
  return props.neighborhoods
    .filter((item) => item.name.toLocaleLowerCase('pt-BR').includes(query))
    .slice(0, 20)
})

watch(
  () => [props.form.neighborhood_id, props.neighborhoods] as const,
  () => {
    if (selectedNeighborhood.value) neighborhoodQuery.value = selectedNeighborhood.value.name
  },
  { immediate: true, deep: true },
)

watch(
  () => props.form.city_id,
  () => {
    neighborhoodQuery.value = ''
    neighborhoodOpen.value = false
  },
)

function handleNeighborhoodInput(event: Event) {
  neighborhoodQuery.value = (event.target as HTMLInputElement).value
  neighborhoodOpen.value = true
  updateForm({ neighborhood_id: '' })
}

function chooseNeighborhood(item: NeighborhoodDto) {
  neighborhoodQuery.value = item.name
  neighborhoodOpen.value = false
  updateForm({ neighborhood_id: item.id, street_id: null, address_reference_id: null })
}
</script>

<template>
  <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(340px,0.72fr)_minmax(560px,1.28fr)]">
    <div
      class="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#00182F]"
    >
      <h2 class="text-xl font-semibold">1. Confirme a localização</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Cada novo clique no mapa atualiza cidade, bairro e endereço. Depois, você pode corrigir
        qualquer campo manualmente.
      </p>

      <div
        class="mt-5 grid gap-4 sm:grid-cols-2 [&>label]:min-w-0 [&_input]:w-full [&_input]:min-w-0 [&_select]:w-full [&_select]:min-w-0"
      >
        <label class="grid gap-1 text-sm font-semibold sm:col-span-2">
          Cidade
          <select
            :value="form.city_id"
            class="min-h-12 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
            :disabled="loadingTerritory"
            @change="handleCityChange"
          >
            <option value="">{{ loadingTerritory ? 'Carregando...' : 'Selecione' }}</option>
            <option v-for="city in cities" :key="city.id" :value="city.id">
              {{ city.name }}
            </option>
          </select>
        </label>

        <label class="relative grid gap-1 text-sm font-semibold sm:col-span-2">
          Bairro{{ allowMissingNeighborhood ? ' (opcional)' : '' }}
          <input
            :value="neighborhoodQuery"
            type="search"
            role="combobox"
            autocomplete="off"
            aria-autocomplete="list"
            :aria-expanded="neighborhoodOpen && filteredNeighborhoods.length > 0"
            aria-controls="camera-neighborhood-suggestions"
            class="min-h-12 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
            :disabled="!form.city_id || loadingNeighborhoods"
            :placeholder="loadingNeighborhoods ? 'Carregando...' : 'Digite para pesquisar o bairro'"
            @focus="neighborhoodOpen = true"
            @input="handleNeighborhoodInput"
            @keydown.escape="neighborhoodOpen = false"
          />
          <ul
            v-if="neighborhoodOpen && filteredNeighborhoods.length"
            id="camera-neighborhood-suggestions"
            role="listbox"
            class="absolute top-full right-0 left-0 z-30 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-[#00182F] dark:text-white"
          >
            <li v-for="item in filteredNeighborhoods" :key="item.id" role="option">
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm font-normal hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none dark:hover:bg-slate-800"
                @click="chooseNeighborhood(item)"
              >
                {{ item.name }}
              </button>
            </li>
          </ul>
        </label>

        <label class="relative grid gap-1 text-sm font-semibold sm:col-span-2">
          Rua ou logradouro
          <input
            :value="form.street"
            role="combobox"
            aria-autocomplete="list"
            :aria-expanded="streetSuggestions.length > 0"
            aria-controls="camera-street-suggestions"
            class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
            autocomplete="street-address"
            @input="handleStreetFieldInput"
            @keydown.escape="emit('clearAutocomplete', 'street')"
          />

          <span
            v-if="autocompleteLoading.street"
            class="absolute right-3 bottom-4 text-xs font-normal text-slate-500"
          >
            Buscando…
          </span>

          <ul
            v-if="streetSuggestions.length"
            id="camera-street-suggestions"
            role="listbox"
            class="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl"
          >
            <li v-for="suggestion in streetSuggestions" :key="suggestion.id" role="option">
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm font-normal hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
                @click="emit('suggestionSelected', suggestion)"
              >
                {{ suggestion.label }}
              </button>
            </li>
          </ul>
        </label>

        <label class="relative grid gap-1 text-sm font-semibold sm:col-span-2">
          Número

          <input
            :value="form.number"
            role="combobox"
            aria-autocomplete="list"
            :aria-expanded="addressSuggestions.length > 0"
            aria-controls="camera-address-suggestions"
            class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
            @input="handleNumberFieldInput"
            @keydown.escape="emit('clearAutocomplete', 'address')"
          />

          <span
            v-if="autocompleteLoading.address"
            class="absolute right-3 top-10 text-xs font-normal text-slate-500"
          >
            Buscando…
          </span>

          <ul
            v-if="addressSuggestions.length"
            id="camera-address-suggestions"
            role="listbox"
            class="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-[#00182F] dark:text-white"
          >
            <li v-for="suggestion in addressSuggestions" :key="suggestion.id" role="option">
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm font-normal hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none dark:hover:bg-slate-800"
                @click="emit('suggestionSelected', suggestion)"
              >
                {{ suggestion.label }}
              </button>
            </li>
          </ul>
        </label>

        <div class="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-semibold">
            Latitude

            <input
              :value="form.latitude ?? ''"
              type="number"
              step="any"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
              @input="emit('coordinateInput', 'latitude', $event)"
            />
          </label>

          <label class="grid gap-1 text-sm font-semibold">
            Longitude

            <input
              :value="form.longitude ?? ''"
              type="number"
              step="any"
              class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
              @input="emit('coordinateInput', 'longitude', $event)"
            />
          </label>
        </div>
      </div>

      <p
        v-if="autocompleteUnavailable"
        class="mt-3 text-sm text-amber-700 dark:text-amber-300"
        role="status"
      >
        A Base georreferenciada oficial está indisponível. Continue preenchendo os campos manualmente.
      </p>
    </div>

    <div>
      <CameraLocationPicker
        :latitude="form.latitude"
        :longitude="form.longitude"
        :city-id="form.city_id"
        :neighborhood-id="form.neighborhood_id"
        @update:latitude="updateForm({ latitude: $event })"
        @update:longitude="updateForm({ longitude: $event })"
        @selected="emit('mapSelected', $event)"
        @suggestion-selected="emit('suggestionSelected', $event)"
      />

      <p class="mt-3 min-h-6 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
        {{ resolvingLocation ? 'Consultando a Base georreferenciada oficial...' : resolutionMessage }}
      </p>
    </div>
  </div>
</template>
