<script setup lang="ts">
import { computed } from 'vue'
import type { CameraApiItem } from '../types/camera'
import { formatCameraDate, formatNullablePercent } from '../utils/cameraPresentation'

const props = withDefaults(
  defineProps<{
    camera: CameraApiItem
    title?: string
    wide?: boolean
  }>(),
  { title: 'Detalhes da análise', wide: false },
)

const analysis = computed(() => props.camera.operational.analysis)
const analysisDisabled = computed(() => props.camera.status !== 'ACTIVE')
const hasValidResult = computed(
  () =>
    !analysisDisabled.value &&
    (analysis.value.status === 'AVAILABLE' || analysis.value.status === 'STALE') &&
    analysis.value.classification !== null &&
    analysis.value.probabilities !== null,
)
const probabilityRows = computed(() => {
  const probabilities = analysis.value.probabilities
  if (!hasValidResult.value || !probabilities) return []
  return [
    { key: 'normal', label: 'Sem indício', value: probabilities.normal, color: 'bg-emerald-600' },
    {
      key: 'medium',
      label: 'Possível alagamento',
      value: probabilities.medium,
      color: 'bg-amber-500',
    },
    {
      key: 'flooded',
      label: 'Indício de alagamento',
      value: probabilities.flooded,
      color: 'bg-red-600',
    },
  ]
})
</script>

<template>
  <section
    class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#00182F]"
  >
    <h2 class="px-4 pt-4 text-lg font-semibold">{{ title }}</h2>

    <div
      class="grid gap-5 px-4 pt-4 pb-5"
      :class="wide ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:gap-8' : ''"
    >
      <div>
        <div v-if="hasValidResult" class="grid gap-4">
          <div v-for="row in probabilityRows" :key="row.key">
            <div class="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span>{{ row.label }}</span>
              <strong>{{ formatNullablePercent(row.value) }}</strong>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                class="h-full rounded-full"
                :class="row.color"
                :style="{ width: `${Math.min(100, Math.max(0, row.value))}%` }"
              ></div>
            </div>
          </div>
        </div>
        <p
          v-else
          class="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {{
            analysisDisabled
              ? props.camera.status === 'OFFLINE'
                ? 'As predições ficam suspensas enquanto a câmera estiver offline. O estado não confirma uma ocorrência.'
                : 'As predições ficam desabilitadas enquanto a câmera estiver inativa.'
              : 'Não há probabilidades válidas para este estado. Ausência de análise não é exibida como 0%.'
          }}
        </p>
      </div>

      <dl class="grid gap-3 text-sm sm:grid-cols-2" :class="wide ? 'lg:grid-cols-2' : 'mt-5'">
        <div>
          <dt class="text-slate-500 dark:text-slate-400">Confiança</dt>
          <dd class="font-semibold">
            {{ formatNullablePercent(hasValidResult ? analysis.confidence : null) }}
          </dd>
        </div>
        <div>
          <dt class="text-slate-500 dark:text-slate-400">Horário da análise</dt>
          <dd class="font-semibold">{{ formatCameraDate(analysis.analyzed_at) }}</dd>
        </div>
        <div>
          <dt class="text-slate-500 dark:text-slate-400">Frames considerados</dt>
          <dd class="font-semibold">{{ analysis.frames ?? 'Não disponível' }}</dd>
        </div>
        <div>
          <dt class="text-slate-500 dark:text-slate-400">Modelo</dt>
          <dd class="font-semibold">{{ analysis.model?.status ?? 'Não disponível' }}</dd>
        </div>
        <div>
          <dt class="text-slate-500 dark:text-slate-400">Versão</dt>
          <dd class="break-all font-semibold">{{ analysis.model?.version ?? 'Não disponível' }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
