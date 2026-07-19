<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import { MapboxComp } from '@/components'
import { useNeighborhood } from '@/composables/neighborhood'
import { useFloodPointOfflineQueue } from '@/composables/useFloodPointOfflineQueue'
import FloodPointsApi from '@/services/FloodPoints'
import { useFloodPointDraftStore } from '@/stores/FloodPointDraft'
import { useFloodPointsStore } from '@/stores/FloodPoints'
import { parseApiError } from '@/utils/apiError'

const MAX_DURATION_MINUTES = 10080
const FORM_STORAGE_KEY = 'aqua:flood-point-form-draft'

const floodPointsApi = new FloodPointsApi()
const floodDraft = useFloodPointDraftStore()
const floodPointsStore = useFloodPointsStore()
const offlineQueue = useFloodPointOfflineQueue()
const {
  loadNeighborhoods,
  getLocalization,
  getIntersectingLocalizations,
  catalogSource,
  loadingTerritories,
  catalogError,
} = useNeighborhood()
const router = useRouter()

const form = reactive({
  city: '',
  cityId: '',
  neighborhood: '',
  neighborhoodId: '',
  possibility: '',
  duration: '',
})

const currentStep = ref<1 | 2 | 3>(1)
const locationIsManual = ref(false)
const showStepErrors = ref(false)
const isSubmitting = ref(false)
const allowNavigation = ref(false)

const probabilityPresets = [
  { value: 30, label: 'Baixo', description: 'Atenção', color: '#46A758' },
  { value: 60, label: 'Moderado', description: 'Alerta', color: '#E0B400' },
  { value: 85, label: 'Alto', description: 'Crítico', color: '#E5484D' },
]

const durationPresets = [30, 60, 120, 360, 720]

const normalizedCity = computed(() => form.city.trim())
const normalizedNeighborhood = computed(() => form.neighborhood.trim())
const canonicalTerritoryConfirmed = computed(
  () => catalogSource.value === 'canonical' && Boolean(form.cityId && form.neighborhoodId),
)

const probabilityValue = computed<number | null>(() => {
  if (form.possibility === '') return null
  const parsed = Number(String(form.possibility).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
})

const durationValue = computed<number | null>(() => {
  if (form.duration === '') return null
  const parsed = Number(String(form.duration).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
})

const locationErrors = computed(() => {
  const errors: string[] = []
  if (!floodDraft.hasGeometry) errors.push('Marque a área afetada no mapa para continuar.')
  if (!normalizedCity.value) errors.push('Confirme a cidade da área marcada.')
  if (!normalizedNeighborhood.value) errors.push('Confirme o bairro da área marcada.')
  if (catalogSource.value === 'canonical' && !canonicalTerritoryConfirmed.value)
    errors.push('A área precisa corresponder a uma cidade e um bairro do catálogo canônico.')
  if (catalogSource.value !== 'canonical')
    errors.push('Aguarde o catálogo territorial canônico para publicar este alerta.')
  return errors
})

const riskErrors = computed(() => {
  const errors: string[] = []
  if (probabilityValue.value === null) {
    errors.push('Selecione o nível de risco ou informe uma probabilidade.')
  } else if (probabilityValue.value < 0 || probabilityValue.value > 100) {
    errors.push('A probabilidade deve ficar entre 0 e 100%.')
  }

  if (durationValue.value === null) {
    errors.push('Selecione por quanto tempo o alerta ficará ativo.')
  } else if (!Number.isInteger(durationValue.value) || durationValue.value <= 0) {
    errors.push('A duração deve ser um número inteiro maior que zero.')
  } else if (durationValue.value > MAX_DURATION_MINUTES) {
    errors.push('A duração máxima permitida é de 7 dias.')
  }
  return errors
})

const validationErrors = computed(() => [...locationErrors.value, ...riskErrors.value])
const canSubmit = computed(() => !validationErrors.value.length && !isSubmitting.value)
const hasUnsavedChanges = computed(
  () =>
    floodDraft.hasGeometry ||
    Boolean(form.city || form.neighborhood || form.possibility || form.duration),
)

const previewFinishedAt = computed(() => {
  if (durationValue.value === null || durationValue.value <= 0) return null
  return new Date(Date.now() + durationValue.value * 60000).toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const riskLevel = computed(() => {
  const value = probabilityValue.value
  if (value === null) return null
  if (value <= 40) return probabilityPresets[0]
  if (value <= 70) return probabilityPresets[1]
  return probabilityPresets[2]
})

const durationLabel = computed(() => {
  const minutes = durationValue.value
  if (minutes === null) return 'Não informada'
  if (minutes < 60) return `${minutes} min`
  if (minutes % 1440 === 0) return `${minutes / 1440} dia${minutes > 1440 ? 's' : ''}`
  if (minutes % 60 === 0) return `${minutes / 60} h`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
})

const geometrySummary = computed(() => {
  const count = floodDraft.drawnFeatures.length
  if (!count) return 'Nenhuma área marcada'
  return `${count} área${count > 1 ? 's' : ''} marcada${count > 1 ? 's' : ''}`
})

const affectedNeighborhoods = computed(() => getIntersectingLocalizations(floodDraft.drawnFeatures))

const applyLocalizationFromArea = () => {
  const point = floodDraft.centroid
  if (!point) {
    floodDraft.setLocalization(null)
    form.city = ''
    form.cityId = ''
    form.neighborhood = ''
    form.neighborhoodId = ''
    return
  }

  const localization = getLocalization(point.lng, point.lat)
  floodDraft.setLocalization(localization)
  if (!localization) {
    form.city = ''
    form.cityId = ''
    form.neighborhood = ''
    form.neighborhoodId = ''
    return
  }

  form.city = localization.city
  form.cityId = localization.cityId ?? ''
  form.neighborhood = localization.neighborhood
  form.neighborhoodId = localization.neighborhoodId ?? ''
  locationIsManual.value = false
}

const setProbability = (value: number) => {
  form.possibility = String(value)
}

const setDuration = (value: number) => {
  form.duration = String(value)
}

const buildPayload = () => {
  if (probabilityValue.value === null || durationValue.value === null) return null
  const representativePoint = floodDraft.centroid
  return {
    city: form.cityId || normalizedCity.value,
    neighborhood: form.neighborhoodId || normalizedNeighborhood.value,
    possibility: probabilityValue.value,
    duration: durationValue.value,
    finished_at: new Date(Date.now() + durationValue.value * 60000).toISOString(),
    props: floodDraft.drawnFeatures,
    location: representativePoint
      ? { type: 'Point', coordinates: [representativePoint.lng, representativePoint.lat] }
      : null,
    footprint: floodDraft.footprint,
  }
}

const goToStep = (step: 1 | 2 | 3) => {
  if (step === 2 && locationErrors.value.length) {
    showStepErrors.value = true
    toast.error(locationErrors.value[0])
    return
  }
  if (step === 3 && [...locationErrors.value, ...riskErrors.value].length) {
    showStepErrors.value = true
    toast.error([...locationErrors.value, ...riskErrors.value][0])
    return
  }

  showStepErrors.value = false
  currentStep.value = step
}

const clearSavedForm = () => {
  window.localStorage.removeItem(FORM_STORAGE_KEY)
}

const resetAll = () => {
  form.city = ''
  form.cityId = ''
  form.neighborhood = ''
  form.neighborhoodId = ''
  form.possibility = ''
  form.duration = ''
  currentStep.value = 1
  locationIsManual.value = false
  floodDraft.clearDraft()
  clearSavedForm()
}

const handleSubmit = async () => {
  if (validationErrors.value.length) {
    showStepErrors.value = true
    toast.error(validationErrors.value[0])
    return
  }
  const payload = buildPayload()
  if (!payload) return

  try {
    isSubmitting.value = true
    if (!navigator.onLine) {
      offlineQueue.enqueue(payload)
      allowNavigation.value = true
      resetAll()
      toast.info('Sem conexão. O alerta será publicado automaticamente quando a rede voltar.')
      router.push('/admin')
      return
    }

    await floodPointsApi.createFloodPoint(payload)

    await floodPointsStore.refresh()
    allowNavigation.value = true
    resetAll()
    toast.success('Alerta de alagamento publicado com sucesso.')
    router.push('/admin')
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && !error.response) {
      offlineQueue.enqueue(payload)
      allowNavigation.value = true
      resetAll()
      toast.info('A conexão falhou. O alerta ficou salvo para sincronização automática.')
      router.push('/admin')
      return
    }
    const parsed = parseApiError(error, 'Não foi possível publicar o alerta de alagamento.')
    toast.error(parsed.message)
  } finally {
    isSubmitting.value = false
  }
}

const confirmLeaving = () =>
  window.confirm('Há um cadastro em andamento. Deseja sair e manter o rascunho para depois?')

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!hasUnsavedChanges.value || allowNavigation.value) return
  event.preventDefault()
}

watch(
  () => floodDraft.centroid,
  () => applyLocalizationFromArea(),
  { deep: true },
)

watch(
  [() => ({ ...form }), currentStep, locationIsManual],
  () => {
    if (!hasUnsavedChanges.value) return clearSavedForm()
    window.localStorage.setItem(
      FORM_STORAGE_KEY,
      JSON.stringify({
        form: { ...form },
        step: currentStep.value,
        locationIsManual: locationIsManual.value,
      }),
    )
  },
  { deep: true },
)

onMounted(async () => {
  try {
    const saved = window.localStorage.getItem(FORM_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as {
        form?: Partial<typeof form>
        step?: 1 | 2 | 3
        locationIsManual?: boolean
      }
      Object.assign(form, parsed.form ?? {})
      if ([1, 2, 3].includes(parsed.step ?? 0)) currentStep.value = parsed.step ?? 1
      locationIsManual.value = Boolean(parsed.locationIsManual)
    }
  } catch {
    clearSavedForm()
  }

  await loadNeighborhoods()
  applyLocalizationFromArea()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

onBeforeRouteLeave(() => {
  if (allowNavigation.value || !hasUnsavedChanges.value) return true
  return confirmLeaving()
})
</script>

<template>
  <section
    class="mt-5 grid w-full gap-5 px-4 md:px-0 lg:grid-cols-[minmax(350px,0.78fr)_minmax(0,1.22fr)] lg:gap-8"
  >
    <div
      class="flex min-w-0 flex-col rounded-4xl border border-[#DCDCDC] bg-white p-5 dark:border-[#24415D] dark:bg-[#00182F] md:p-7"
    >
      <div>
        <p class="text-xs font-semibold tracking-[0.18em] text-[#2768CA] uppercase">Novo alerta</p>
        <h1 class="mt-1 text-2xl font-semibold md:text-3xl">Cadastrar ponto de alagamento</h1>
        <p class="mt-2 text-sm text-[#6B7280] dark:text-[#AEBAC6]">
          Marque a área, defina o risco e revise antes de publicar.
        </p>
      </div>

      <ol class="mt-6 grid grid-cols-3 gap-2" aria-label="Etapas do cadastro">
        <li v-for="step in 3" :key="step" class="min-w-0">
          <button
            type="button"
            class="flex w-full items-center gap-2 text-left"
            :aria-current="currentStep === step ? 'step' : undefined"
            @click="step < currentStep ? goToStep(step as 1 | 2 | 3) : undefined"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors"
              :class="
                currentStep >= step
                  ? 'bg-[#2768CA] text-white'
                  : 'bg-[#E8EEF7] text-[#6B7280] dark:bg-[#18334E]'
              "
            >
              <span v-if="currentStep > step" class="material-symbols-outlined text-lg">check</span>
              <span v-else>{{ step }}</span>
            </span>
            <span class="hidden truncate text-xs font-semibold sm:block">
              {{ step === 1 ? 'Localização' : step === 2 ? 'Risco' : 'Revisão' }}
            </span>
          </button>
          <div class="mt-2 h-1 rounded-full bg-[#E8EEF7] dark:bg-[#18334E]">
            <div v-if="currentStep >= step" class="h-full rounded-full bg-[#2768CA]"></div>
          </div>
        </li>
      </ol>

      <form class="mt-6 flex flex-1 flex-col" @submit.prevent="handleSubmit">
        <div v-if="currentStep === 1" class="grid gap-5">
          <div class="rounded-2xl bg-[#F3F6FA] p-4 dark:bg-[#071F36]">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span
                  class="grid size-10 place-items-center rounded-full bg-[#2768CA]/15 text-[#2768CA]"
                >
                  <span class="material-symbols-outlined">gesture</span>
                </span>
                <div>
                  <p class="text-sm font-semibold">{{ geometrySummary }}</p>
                  <p class="text-xs text-[#6B7280] dark:text-[#AEBAC6]">
                    {{
                      floodDraft.hasGeometry
                        ? 'Você pode ajustar o contorno no mapa.'
                        : 'Use o botão “Marcar área” no mapa.'
                    }}
                  </p>
                </div>
              </div>
              <span v-if="floodDraft.hasGeometry" class="material-symbols-outlined text-[#46A758]"
                >check_circle</span
              >
            </div>
          </div>

          <div
            v-if="floodDraft.localization && !locationIsManual"
            class="rounded-2xl border border-[#B8D0EE] p-4 dark:border-[#315879]"
          >
            <div class="flex items-start gap-3">
              <div class="flex gap-3">
                <span class="material-symbols-outlined text-[#2768CA]">location_on</span>
                <div>
                  <p class="text-xs text-[#6B7280] dark:text-[#AEBAC6]">Localização identificada</p>
                  <p class="mt-1 font-semibold">{{ form.neighborhood }}, {{ form.city }}</p>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex gap-3 rounded-2xl border p-4 text-sm"
            :class="
              catalogSource === 'canonical'
                ? 'border-[#B8D0EE] bg-[#2768CA]/5'
                : 'border-[#E0B400]/60 bg-[#E0B400]/10'
            "
            role="status"
            aria-live="polite"
          >
            <span class="material-symbols-outlined" aria-hidden="true">{{
              catalogSource === 'canonical' ? 'verified' : 'warning'
            }}</span>
            <div>
              <p class="font-semibold">
                {{
                  loadingTerritories
                    ? 'Consultando o catálogo territorial'
                    : catalogSource === 'canonical'
                      ? 'Território confirmado pelo Aqua'
                      : catalogSource === 'local-fallback'
                        ? 'Referência territorial local'
                        : 'Território indisponível'
                }}
              </p>
              <p class="mt-1 text-xs text-[#6B7280] dark:text-[#AEBAC6]">
                {{
                  catalogError ??
                  'Cidade e bairro vêm do catálogo canônico do backend; o mapa é apenas um apoio visual.'
                }}
              </p>
            </div>
          </div>

          <div
            v-if="affectedNeighborhoods.length > 1"
            class="flex gap-3 rounded-2xl border border-[#E0B400]/60 bg-[#E0B400]/10 p-4"
          >
            <span class="material-symbols-outlined text-[#B78B00]">warning</span>
            <div>
              <p class="text-sm font-semibold">A área atravessa mais de um bairro</p>
              <p class="mt-1 text-xs text-[#6B7280] dark:text-[#AEBAC6]">
                {{ affectedNeighborhoods.map((item) => item.neighborhood).join(', ') }}. O bairro
                principal foi definido automaticamente pela posição da área.
              </p>
            </div>
          </div>

          <div class="grid gap-4">
            <p class="text-sm text-[#6B7280] dark:text-[#AEBAC6]">
              {{
                floodDraft.hasGeometry
                  ? 'Cidade e bairro são definidos automaticamente pela área marcada.'
                  : 'Após marcar a área, identificaremos o bairro automaticamente.'
              }}
            </p>
            <div class="grid gap-2">
              <label for="city" class="text-sm font-semibold">Cidade</label>
              <input
                id="city"
                v-model="form.city"
                type="text"
                readonly
                aria-readonly="true"
                autocomplete="address-level2"
                placeholder="Aguardando área válida"
                class="w-full cursor-not-allowed rounded-2xl border border-[#D0D7E2] bg-[#F3F6FA] px-4 py-3 text-sm text-[#4B5563] outline-none dark:border-[#31516D] dark:bg-[#071F36] dark:text-[#D7E0E8]"
              />
            </div>
            <div class="grid gap-2">
              <label for="neighborhood" class="text-sm font-semibold">Bairro</label>
              <input
                id="neighborhood"
                v-model="form.neighborhood"
                type="text"
                readonly
                aria-readonly="true"
                autocomplete="address-level3"
                placeholder="Aguardando área válida"
                class="w-full cursor-not-allowed rounded-2xl border border-[#D0D7E2] bg-[#F3F6FA] px-4 py-3 text-sm text-[#4B5563] outline-none dark:border-[#31516D] dark:bg-[#071F36] dark:text-[#D7E0E8]"
              />
            </div>
          </div>

          <ul
            v-if="showStepErrors && locationErrors.length"
            class="grid gap-1 rounded-2xl bg-[#DC2626]/10 p-3 text-xs text-[#DC2626]"
            aria-live="polite"
          >
            <li v-for="error in locationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <div v-else-if="currentStep === 2" class="grid gap-6">
          <fieldset>
            <legend class="font-semibold">Qual é o nível de risco?</legend>
            <p class="mt-1 text-xs text-[#6B7280] dark:text-[#AEBAC6]">
              A cor da área no mapa acompanha o nível selecionado.
            </p>
            <div class="mt-4 grid grid-cols-3 gap-2">
              <button
                v-for="preset in probabilityPresets"
                :key="preset.value"
                type="button"
                class="rounded-2xl border p-3 text-left transition-all"
                :class="
                  probabilityValue === preset.value
                    ? 'border-[#2768CA] bg-[#2768CA]/10 ring-1 ring-[#2768CA]'
                    : 'border-[#DCDCDC] hover:border-[#7AA6C8] dark:border-[#31516D]'
                "
                @click="setProbability(preset.value)"
              >
                <span
                  class="mb-2 block size-2.5 rounded-full"
                  :style="{ backgroundColor: preset.color }"
                ></span>
                <span class="block text-xs font-semibold sm:text-sm">{{ preset.label }}</span>
                <span class="block text-[10px] text-[#6B7280] sm:text-xs"
                  >{{ preset.value }}% · {{ preset.description }}</span
                >
              </button>
            </div>
          </fieldset>

          <div class="grid gap-2">
            <div class="flex items-center justify-between gap-4">
              <label for="possibility" class="text-sm font-semibold">Probabilidade estimada</label>
              <div class="flex items-center rounded-xl border border-[#7AA6C8] px-3 py-1.5">
                <input
                  id="possibility"
                  v-model="form.possibility"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  inputmode="numeric"
                  class="w-10 bg-transparent text-right text-sm font-semibold outline-none"
                />
                <span class="text-sm font-semibold">%</span>
              </div>
            </div>
            <input
              v-model="form.possibility"
              type="range"
              min="0"
              max="100"
              step="1"
              aria-label="Probabilidade estimada"
              class="w-full accent-[#2768CA]"
            />
            <div class="flex justify-between text-[10px] text-[#6B7280]">
              <span>0%</span><span>100%</span>
            </div>
          </div>

          <fieldset>
            <legend class="font-semibold">Por quanto tempo?</legend>
            <p class="mt-1 text-xs text-[#6B7280] dark:text-[#AEBAC6]">
              O alerta será encerrado automaticamente.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="minutes in durationPresets"
                :key="minutes"
                type="button"
                class="rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
                :class="
                  durationValue === minutes
                    ? 'border-[#2768CA] bg-[#2768CA] text-white'
                    : 'border-[#7AA6C8] text-[#2768CA] hover:bg-[#2768CA]/10'
                "
                @click="setDuration(minutes)"
              >
                {{ minutes < 60 ? `${minutes} min` : `${minutes / 60} h` }}
              </button>
            </div>
            <div class="mt-3 flex items-center gap-3">
              <label for="duration" class="text-xs text-[#6B7280] dark:text-[#AEBAC6]"
                >Outro tempo:</label
              >
              <div class="flex items-center rounded-xl border border-[#7AA6C8] px-3 py-2">
                <input
                  id="duration"
                  v-model="form.duration"
                  type="number"
                  min="1"
                  :max="MAX_DURATION_MINUTES"
                  step="1"
                  inputmode="numeric"
                  placeholder="Ex: 90"
                  class="w-20 bg-transparent text-sm outline-none"
                />
                <span class="text-xs text-[#6B7280]">min</span>
              </div>
            </div>
          </fieldset>

          <div
            v-if="previewFinishedAt"
            class="flex gap-3 rounded-2xl bg-[#F3F6FA] p-4 dark:bg-[#071F36]"
          >
            <span class="material-symbols-outlined text-[#2768CA]">schedule</span>
            <div>
              <p class="text-xs text-[#6B7280] dark:text-[#AEBAC6]">Encerramento automático</p>
              <p class="text-sm font-semibold">{{ previewFinishedAt }}</p>
            </div>
          </div>

          <ul
            v-if="showStepErrors && riskErrors.length"
            class="grid gap-1 rounded-2xl bg-[#DC2626]/10 p-3 text-xs text-[#DC2626]"
            aria-live="polite"
          >
            <li v-for="error in riskErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <div v-else class="grid gap-5">
          <div class="flex items-center gap-3 rounded-2xl bg-[#2768CA]/10 p-4 text-[#2768CA]">
            <span class="material-symbols-outlined">fact_check</span>
            <div>
              <p class="font-semibold">Tudo pronto para publicar</p>
              <p class="text-xs">Confira os dados do alerta antes de confirmar.</p>
            </div>
          </div>

          <dl
            class="divide-y divide-[#DCDCDC] rounded-2xl border border-[#DCDCDC] px-4 dark:divide-[#31516D] dark:border-[#31516D]"
          >
            <div class="flex justify-between gap-4 py-4">
              <dt class="text-sm text-[#6B7280] dark:text-[#AEBAC6]">Localização</dt>
              <dd class="text-right text-sm font-semibold">
                {{ form.neighborhood }}, {{ form.city }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 py-4">
              <dt class="text-sm text-[#6B7280] dark:text-[#AEBAC6]">Área</dt>
              <dd class="text-right text-sm font-semibold">{{ geometrySummary }}</dd>
            </div>
            <div class="flex justify-between gap-4 py-4">
              <dt class="text-sm text-[#6B7280] dark:text-[#AEBAC6]">Risco</dt>
              <dd class="flex items-center gap-2 text-right text-sm font-semibold">
                <span
                  class="size-2.5 rounded-full"
                  :style="{ backgroundColor: riskLevel?.color }"
                ></span
                >{{ riskLevel?.label }} · {{ probabilityValue }}%
              </dd>
            </div>
            <div class="flex justify-between gap-4 py-4">
              <dt class="text-sm text-[#6B7280] dark:text-[#AEBAC6]">Validade</dt>
              <dd class="text-right text-sm font-semibold">
                {{ durationLabel
                }}<span v-if="previewFinishedAt" class="block text-xs font-normal text-[#6B7280]"
                  >até {{ previewFinishedAt }}</span
                >
              </dd>
            </div>
          </dl>

          <p class="flex gap-2 text-xs text-[#6B7280] dark:text-[#AEBAC6]">
            <span class="material-symbols-outlined text-lg">info</span>Ao publicar, a área ficará
            visível no mapa para os usuários enquanto o alerta estiver ativo.
          </p>
        </div>

        <div class="mt-auto flex gap-3 pt-7">
          <button
            v-if="currentStep > 1"
            type="button"
            class="rounded-full border border-[#7AA6C8] px-5 py-3 text-sm font-semibold text-[#2768CA]"
            @click="goToStep((currentStep - 1) as 1 | 2)"
          >
            Voltar
          </button>
          <button
            v-if="currentStep < 3"
            type="button"
            class="ml-auto flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2768CA] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f57ad]"
            @click="goToStep((currentStep + 1) as 2 | 3)"
          >
            {{ currentStep === 1 ? 'Definir risco' : 'Revisar alerta'
            }}<span class="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <button
            v-else
            type="submit"
            :disabled="!canSubmit"
            class="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2768CA] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f57ad] disabled:cursor-not-allowed disabled:bg-[#9CA3AF]"
          >
            <span class="material-symbols-outlined text-lg">campaign</span
            >{{ isSubmitting ? 'Publicando...' : 'Publicar alerta' }}
          </button>
        </div>
      </form>
    </div>

    <div class="min-w-0">
      <MapboxComp :draft-probability="probabilityValue ?? undefined" />
    </div>
  </section>
</template>
