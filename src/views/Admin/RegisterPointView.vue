<!-- <script setup lang="ts">
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
</template> -->

<script setup lang="ts">
import { MapboxComp } from '@/components'
import { useFloodPointRegistration } from '@/composables/useFloodPointRegistration'

const {
  floodDraft,
  form,
  currentStep,
  locationIsManual,
  showStepErrors,
  isSubmitting,
  probabilityPresets,
  durationPresets,
  MAX_DURATION_MINUTES,
  catalogSource,
  loadingTerritories,
  catalogError,
  probabilityValue,
  durationValue,
  locationErrors,
  riskErrors,
  canSubmit,
  previewFinishedAt,
  riskLevel,
  durationLabel,
  geometrySummary,
  affectedNeighborhoods,
  affectedNeighborhoodLabels,
  setProbability,
  setDuration,
  goToStep,
  handleSubmit,
} = useFloodPointRegistration()
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
                {{ affectedNeighborhoodLabels.join(', ') }}. O bairro principal foi definido
                automaticamente pela posição da área.
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
