<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { MapboxComp } from '@/components'
import { useNeighborhood } from '@/composables/neighborhood'
import FloodPointsApi from '@/services/FloodPoints'
import { useFloodPointDraftStore } from '@/stores/FloodPointDraft'
import { useFloodPointsStore } from '@/stores/FloodPoints'
import type { IFormField } from '@/types/form'
import { parseApiError } from '@/utils/apiError'

const MAX_DURATION_MINUTES = 10080

const floodPointsApi = new FloodPointsApi()
const floodDraft = useFloodPointDraftStore()
const floodPointsStore = useFloodPointsStore()
const { loadNeighborhoods, getLocalization } = useNeighborhood()
const router = useRouter()

const form = reactive({
  city: '',
  neighborhood: '',
  possibility: '',
  duration: '',
})

const touched = reactive({
  city: false,
  neighborhood: false,
})

const isSubmitting = ref(false)

const normalizedCity = computed(() => form.city.trim())
const normalizedNeighborhood = computed(() => form.neighborhood.trim())

const probabilityValue = computed<number | null>(() => {
  const parsed = Number(String(form.possibility).replace(',', '.'))
  if (!Number.isFinite(parsed)) return null
  return parsed
})

const durationValue = computed<number | null>(() => {
  const parsed = Number(String(form.duration).replace(',', '.'))
  if (!Number.isFinite(parsed)) return null
  return parsed
})

const validationErrors = computed(() => {
  const errors: string[] = []

  if (!floodDraft.hasGeometry) {
    errors.push('Desenhe ao menos um poligono no mapa antes de cadastrar.')
  }

  if (!normalizedCity.value) {
    errors.push('Informe a cidade.')
  }

  if (!normalizedNeighborhood.value) {
    errors.push('Informe o bairro.')
  }

  if (probabilityValue.value === null) {
    errors.push('Informe a probabilidade.')
  } else if (probabilityValue.value < 0 || probabilityValue.value > 100) {
    errors.push('A probabilidade deve ficar entre 0 e 100.')
  }

  if (durationValue.value === null) {
    errors.push('Informe a duracao em minutos.')
  } else if (!Number.isInteger(durationValue.value) || durationValue.value <= 0) {
    errors.push('A duracao deve ser um numero inteiro maior que zero.')
  } else if (durationValue.value > MAX_DURATION_MINUTES) {
    errors.push(`A duracao maxima permitida e ${MAX_DURATION_MINUTES} minutos.`)
  }

  return errors
})

const canSubmit = computed(() => !validationErrors.value.length && !isSubmitting.value)

const previewFinishedAt = computed(() => {
  if (durationValue.value === null || durationValue.value <= 0) return null
  return new Date(Date.now() + durationValue.value * 60000).toLocaleString('pt-BR')
})

const geometrySummary = computed(() => {
  const count = floodDraft.drawnFeatures.length
  if (!count) return 'Nenhuma geometria desenhada'
  return `${count} geometria${count > 1 ? 's' : ''} pronta${count > 1 ? 's' : ''}`
})

const applyLocalizationFromCentroid = (force = false) => {
  const centroid = floodDraft.centroid

  if (!centroid) {
    floodDraft.setLocalization(null)

    if (force) {
      form.city = ''
      form.neighborhood = ''
    }

    return
  }

  const localization = getLocalization(centroid.lng, centroid.lat)
  if (!localization) {
    floodDraft.setLocalization(null)
    return
  }

  floodDraft.setLocalization(localization)

  if (force || !touched.city || !normalizedCity.value) {
    form.city = localization.city
  }

  if (force || !touched.neighborhood || !normalizedNeighborhood.value) {
    form.neighborhood = localization.neighborhood
  }
}

watch(
  () => floodDraft.centroid,
  () => {
    applyLocalizationFromCentroid(false)
  },
  { deep: true, immediate: true },
)

onMounted(async () => {
  await loadNeighborhoods()
  applyLocalizationFromCentroid(false)
})

const resetForm = () => {
  form.city = ''
  form.neighborhood = ''
  form.possibility = ''
  form.duration = ''

  touched.city = false
  touched.neighborhood = false
}

const handleSubmit = async () => {
  if (validationErrors.value.length > 0) {
    toast.error(validationErrors.value[0])
    return
  }

  if (probabilityValue.value === null || durationValue.value === null) return

  const finishedAt = new Date(Date.now() + durationValue.value * 60000).toISOString()

  try {
    isSubmitting.value = true

    await floodPointsApi.createFloodPoint({
      city: normalizedCity.value,
      neighborhood: normalizedNeighborhood.value,
      possibility: probabilityValue.value,
      duration: durationValue.value,
      finished_at: finishedAt,
      props: floodDraft.drawnFeatures,
    })

    await floodPointsStore.refresh()
    toast.success('Ponto de alagamento cadastrado com sucesso.')

    floodDraft.clearDraft()
    resetForm()
    router.push('/admin')
  } catch (error: unknown) {
    const parsed = parseApiError(error, 'Nao foi possivel cadastrar o ponto de alagamento.')
    toast.error(parsed.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="mt-5 flex w-full flex-col gap-5 lg:flex-row lg:justify-between lg:gap-10">
    <div
      class="grid gap-5 rounded-4xl border border-[#DCDCDC] px-5 py-6 md:px-8 lg:w-[38%] lg:min-w-97.5 lg:py-8"
    >
      <div>
        <h1 class="text-3xl font-semibold">Cadastrar novo ponto</h1>
        <p class="mt-2 text-sm text-[#6B7280]">
          Desenhe o poligono no mapa e preencha os campos obrigatorios.
        </p>
      </div>

      <div class="rounded-2xl bg-[#F3F4F6] p-4 text-sm dark:bg-[#00182F]">
        <p class="font-semibold">{{ geometrySummary }}</p>
        <p class="mt-1 text-[#6B7280]" v-if="floodDraft.centroid">
          Centroide: {{ floodDraft.centroid.lat.toFixed(5) }},
          {{ floodDraft.centroid.lng.toFixed(5) }}
        </p>
        <p class="mt-1 text-[#6B7280]" v-if="floodDraft.localization">
          Localizacao detectada: {{ floodDraft.localization.neighborhood }} -
          {{ floodDraft.localization.city }}
        </p>
      </div>

      <form class="grid gap-4" @submit.prevent="handleSubmit">
        <div class="grid gap-2">
          <label for="city" class="font-semibold">Cidade</label>
          <input
            id="city"
            v-model="form.city"
            type="text"
            autocomplete="address-level2"
            placeholder="Digite a cidade"
            class="w-full rounded-2xl border border-[#7AA6C8] px-3 py-3 text-sm outline-none focus:bg-[#7AA6C8]/20"
            @input="touched.city = true"
          />
        </div>

        <div class="grid gap-2">
          <label for="neighborhood" class="font-semibold">Bairro</label>
          <input
            id="neighborhood"
            v-model="form.neighborhood"
            type="text"
            autocomplete="address-level3"
            placeholder="Digite o bairro"
            class="w-full rounded-2xl border border-[#7AA6C8] px-3 py-3 text-sm outline-none focus:bg-[#7AA6C8]/20"
            @input="touched.neighborhood = true"
          />
        </div>

        <button
          type="button"
          class="w-fit rounded-full border border-[#2966C1] px-4 py-2 text-xs font-semibold text-[#2966C1] transition-colors hover:bg-[#2966C1] hover:text-white"
          @click="applyLocalizationFromCentroid(true)"
        >
          Usar localizacao automatica
        </button>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="grid gap-2">
            <label for="possibility" class="font-semibold">Probabilidade (%)</label>
            <input
              id="possibility"
              v-model="form.possibility"
              type="number"
              min="0"
              max="100"
              step="0.01"
              inputmode="decimal"
              placeholder="0 a 100"
              class="w-full rounded-2xl border border-[#7AA6C8] px-3 py-3 text-sm outline-none focus:bg-[#7AA6C8]/20"
            />
          </div>

          <div class="grid gap-2">
            <label for="duration" class="font-semibold">Duracao (minutos)</label>
            <input
              id="duration"
              v-model="form.duration"
              type="number"
              min="1"
              :max="MAX_DURATION_MINUTES"
              step="1"
              inputmode="numeric"
              placeholder="Ex: 120"
              class="w-full rounded-2xl border border-[#7AA6C8] px-3 py-3 text-sm outline-none focus:bg-[#7AA6C8]/20"
            />
          </div>
        </div>

        <p class="text-xs text-[#6B7280]" v-if="previewFinishedAt">
          Encerramento estimado: {{ previewFinishedAt }}
        </p>

        <ul class="grid gap-1 text-xs text-[#DC2626]" v-if="validationErrors.length">
          <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
        </ul>

        <button
          type="submit"
          :disabled="!canSubmit"
          class="mt-2 rounded-full px-6 py-3 text-lg font-semibold text-white transition-opacity"
          :class="[
            canSubmit
              ? 'bg-[#2966C1] hover:bg-[#2966C1]/90'
              : 'cursor-not-allowed bg-[#9CA3AF] opacity-80',
          ]"
        >
          {{ isSubmitting ? 'Cadastrando...' : 'Cadastrar' }}
        </button>
      </form>
    </div>

    <div class="w-full lg:w-[62%]">
      <MapboxComp />
    </div>
  </section>
</template>
