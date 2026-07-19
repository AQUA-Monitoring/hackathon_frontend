<script setup lang="ts">
import { computed } from 'vue'
import { HlsPlayer } from '@/components'
import { useFloodDemo } from '@/composables/useFloodDemo'
import type { FloodDemoStatus } from '@/types/floodDemo'
import { formatNullablePercent } from '@/utils/cameraPresentation'

const {
  stream,
  prediction,
  loading,
  predictionLoading,
  changingState,
  pageError,
  predictionMessage,
  actionMessage,
  isAdmin,
  isReady,
  refresh,
  changeState,
} = useFloodDemo()

const statusContent: Record<FloodDemoStatus, { label: string; message: string; icon: string }> = {
  disabled: {
    label: 'Demo desativada',
    message: 'A transmissão de demonstração está desativada.',
    icon: 'power_settings_new',
  },
  starting: {
    label: 'Preparando transmissão',
    message: 'O vídeo está sendo preparado. Aguarde alguns instantes.',
    icon: 'hourglass_top',
  },
  ready: {
    label: 'Demonstração pronta',
    message: 'A transmissão está disponível para inspeção.',
    icon: 'sensors',
  },
  unavailable: {
    label: 'Transmissão indisponível',
    message: 'O serviço da transmissão não está disponível.',
    icon: 'cloud_off',
  },
  error: {
    label: 'Falha na transmissão',
    message: 'Não foi possível iniciar ou manter a transmissão.',
    icon: 'error',
  },
}

const currentStatus = computed(() =>
  stream.value ? statusContent[stream.value.status] : statusContent.starting,
)
const analysisAvailable = computed(() => {
  const current = prediction.value
  if (!current) return false
  return (
    current.model.ready === true &&
    current.model.fallback === false &&
    current.prediction.probabilities !== null &&
    ['normal', 'medium', 'flooded'].includes(current.prediction.state)
  )
})

const result = computed(() => {
  if (predictionLoading.value && !prediction.value)
    return {
      label: 'Análise em andamento',
      message: 'Os frames da demonstração estão sendo processados.',
      tone: 'neutral',
      icon: 'progress_activity',
    }
  if (!analysisAvailable.value)
    return {
      label: 'Análise indisponível',
      message:
        predictionMessage.value || 'Ainda não há um resultado automático válido para esta sessão.',
      tone: 'neutral',
      icon: 'info',
    }
  if (prediction.value?.prediction.state === 'flooded')
    return {
      label: 'Indício de alagamento',
      message: 'A análise automática encontrou sinais compatíveis com alagamento.',
      tone: 'risk',
      icon: 'flood',
    }
  if (prediction.value?.prediction.state === 'medium')
    return {
      label: 'Atenção: possível alagamento',
      message: 'A análise automática encontrou sinais que exigem inspeção.',
      tone: 'attention',
      icon: 'warning',
    }
  return {
    label: 'Sem indício na análise',
    message: 'A análise automática não encontrou indício de alagamento.',
    tone: 'safe',
    icon: 'check_circle',
  }
})

const resultTone = computed(() => {
  if (result.value.tone === 'risk')
    return 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200'
  if (result.value.tone === 'attention')
    return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
  if (result.value.tone === 'safe')
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
  return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
})

const probabilityRows = computed(() => {
  const probabilities = analysisAvailable.value ? prediction.value?.prediction.probabilities : null
  if (!probabilities) return []
  const rows: Array<{ state: string; label: string; value: number; color: string }> = []
  if (typeof probabilities.normal === 'number' && Number.isFinite(probabilities.normal)) {
    rows.push({
      state: 'normal',
      label: 'Sem indício',
      value: probabilities.normal,
      color: 'bg-emerald-600',
    })
  }
  if (typeof probabilities.medium === 'number' && Number.isFinite(probabilities.medium)) {
    rows.push({
      state: 'medium',
      label: 'Possível alagamento',
      value: probabilities.medium,
      color: 'bg-amber-500',
    })
  }
  if (typeof probabilities.flooded === 'number' && Number.isFinite(probabilities.flooded)) {
    rows.push({
      state: 'flooded',
      label: 'Indício de alagamento',
      value: probabilities.flooded,
      color: 'bg-red-600',
    })
  }
  return rows
})

function scenarioLabel(state?: string | null) {
  const labels: Record<string, string> = {
    auto: 'Sequência automática',
    normal: 'Sem alagamento esperado',
    medium: 'Cenário intermediário',
    flooded: 'Alagamento esperado',
    unknown: 'Sem estado esperado',
  }
  return state ? (labels[state] ?? state) : 'Não disponível'
}

function analysisLabel(state?: string | null) {
  if (!analysisAvailable.value) return 'Análise indisponível'
  if (state === 'flooded') return 'Indício de alagamento'
  if (state === 'medium') return 'Atenção: possível alagamento'
  if (state === 'normal') return 'Sem indício na análise'
  return 'Análise indisponível'
}

function statusTone(status?: FloodDemoStatus) {
  if (status === 'ready')
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
  if (status === 'starting')
    return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
}
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:py-10 dark:text-white">
    <header class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold tracking-[0.18em] text-[#2768CA] uppercase">
          Ambiente controlado
        </p>
        <h1 class="mt-1 text-3xl font-semibold sm:text-4xl">
          Demonstração — não gera alerta operacional
        </h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
          Use este fluxo para observar o player e o comportamento do modelo. O resultado não
          representa uma câmera operacional nem uma ocorrência confirmada.
        </p>
      </div>
      <span
        v-if="stream"
        class="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
        :class="statusTone(stream.status)"
      >
        <span class="material-symbols-outlined text-lg" aria-hidden="true">{{
          currentStatus.icon
        }}</span
        >{{ currentStatus.label }}
      </span>
    </header>

    <div
      v-if="pageError"
      role="alert"
      class="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      <span>{{ pageError }}</span
      ><button type="button" class="min-h-11 font-semibold underline" @click="refresh">
        Tentar novamente
      </button>
    </div>

    <div
      v-if="loading && !stream"
      class="grid min-h-96 place-items-center rounded-3xl bg-slate-100 dark:bg-[#00182F]"
    >
      <div class="text-center text-slate-500">
        <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
        <p class="mt-2">Consultando demonstração...</p>
      </div>
    </div>

    <template v-else-if="stream">
      <p
        v-if="stream.source?.type === 'uploader'"
        class="mb-4 inline-flex items-center gap-2 rounded-full bg-[#2768CA]/10 px-4 py-2 text-sm font-semibold text-[#2768CA] dark:bg-[#2768CA]/20 dark:text-[#9CC4FF]"
      >
        <span class="material-symbols-outlined text-lg" aria-hidden="true">upload_file</span>
        Fonte: vídeo enviado pelo uploader
      </p>
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.65fr)]">
        <div class="overflow-hidden rounded-3xl bg-[#00182F] shadow-xl">
          <div v-if="isReady" class="aspect-video">
            <HlsPlayer
              :key="stream.session_id ?? stream.hls_url ?? 'demo'"
              :src="stream.hls_url ?? ''"
              :muted="true"
              :controls="true"
              :lock-to-live="true"
              :live-delay="3"
              :max-delay-sec="20"
            />
          </div>
          <div v-else class="grid aspect-video place-items-center px-8 text-center text-white">
            <div>
              <span class="material-symbols-outlined text-6xl text-[#7AA6C8]">{{
                currentStatus.icon
              }}</span>
              <h2 class="mt-3 text-xl font-semibold">{{ currentStatus.label }}</h2>
              <p class="mt-2 max-w-md text-sm text-slate-300">{{ currentStatus.message }}</p>
            </div>
          </div>
        </div>

        <aside
          class="rounded-3xl border bg-white p-5 shadow-sm sm:p-6 dark:bg-[#001C3B]"
          :class="resultTone"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-semibold tracking-[0.14em] uppercase">Análise automática</p>
            <span v-if="predictionLoading" class="material-symbols-outlined animate-spin"
              >progress_activity</span
            >
          </div>
          <div class="mt-5 flex items-start gap-3">
            <span class="material-symbols-outlined shrink-0 text-4xl" aria-hidden="true">{{
              result.icon
            }}</span>
            <div>
              <h2 class="text-2xl font-semibold">{{ result.label }}</h2>
              <p class="mt-2 text-sm">{{ result.message }}</p>
            </div>
          </div>
          <p
            v-if="predictionMessage && prediction"
            class="mt-4 border-t border-current/20 pt-4 text-sm"
          >
            {{ predictionMessage }}
          </p>
        </aside>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#001C3B]"
        >
          <h2 class="text-xl font-semibold">Esperado × analisado</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Comparação de validação da demonstração, separada da condição operacional.
          </p>
          <div v-if="prediction" class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-4 dark:bg-[#071F36]">
              <p class="text-xs text-slate-500 dark:text-slate-400">Esperado no cenário</p>
              <p class="mt-1 font-semibold">{{ scenarioLabel(prediction.validation.expected) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4 dark:bg-[#071F36]">
              <p class="text-xs text-slate-500 dark:text-slate-400">Analisado pelo modelo</p>
              <p class="mt-1 font-semibold">{{ analysisLabel(prediction.validation.actual) }}</p>
            </div>
            <p
              class="sm:col-span-2 rounded-2xl p-4 text-sm font-semibold"
              :class="
                prediction.validation.match === true
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : prediction.validation.match === false
                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
              "
            >
              {{
                prediction.validation.match === true
                  ? 'Resultado correspondente ao cenário'
                  : prediction.validation.match === false
                    ? 'Divergência entre cenário e análise'
                    : 'Sem comparação disponível'
              }}
            </p>
          </div>
          <p v-else class="mt-5 text-sm text-slate-500">
            A comparação aparecerá após uma análise válida.
          </p>
        </section>

        <section
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#001C3B]"
          aria-labelledby="demo-probabilities-title"
        >
          <h2 id="demo-probabilities-title" class="text-xl font-semibold">
            Probabilidades e modelo
          </h2>
          <div class="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div v-if="probabilityRows.length" class="grid gap-5">
              <div v-for="item in probabilityRows" :key="item.state">
                <div class="mb-2 flex justify-between gap-3 text-sm">
                  <span>{{ item.label }}</span
                  ><strong>{{ formatNullablePercent(item.value) }}</strong>
                </div>
                <div class="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="h-full rounded-full"
                    :class="item.color"
                    :style="{ width: `${Math.min(100, Math.max(0, item.value))}%` }"
                  ></div>
                </div>
              </div>
            </div>
            <p
              v-else
              class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              Probabilidades indisponíveis. Ausência de resultado não é exibida como 0%.
            </p>
            <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-slate-500">Confiança</dt>
                <dd class="font-semibold">
                  {{
                    formatNullablePercent(
                      analysisAvailable ? (prediction?.prediction.confidence ?? null) : null,
                    )
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Frames</dt>
                <dd class="font-semibold">
                  {{
                    analysisAvailable
                      ? (prediction?.prediction.frames ?? 'Não disponível')
                      : 'Não disponível'
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Modelo</dt>
                <dd class="font-semibold">
                  {{ analysisAvailable ? 'Disponível' : 'Análise indisponível' }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Versão</dt>
                <dd class="break-all font-semibold">
                  {{
                    analysisAvailable
                      ? (prediction?.model.version ?? 'Não disponível')
                      : 'Não disponível'
                  }}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <section
        v-if="isAdmin && stream.available_states.length"
        class="mt-6 rounded-3xl border-2 border-dashed border-[#2768CA]/40 bg-[#2768CA]/5 p-5 sm:p-6 dark:bg-[#00182F]"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-semibold tracking-[0.14em] text-[#2768CA] uppercase">
              Área restrita
            </p>
            <h2 class="mt-1 text-xl font-semibold">Controles administrativos</h2>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Alterar o estado reinicia a sessão e invalida a análise anterior.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="state in stream.available_states"
              :key="state"
              type="button"
              class="min-h-11 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              :class="
                stream.demo_state === state
                  ? 'bg-[#2768CA] text-white'
                  : 'border border-[#2768CA] bg-white text-[#2768CA] dark:bg-[#001C3B]'
              "
              :disabled="!!changingState || stream.demo_state === state"
              @click="changeState(state)"
            >
              {{ changingState === state ? 'Alterando...' : scenarioLabel(state) }}
            </button>
          </div>
        </div>
        <p
          v-if="actionMessage"
          role="alert"
          class="mt-4 text-sm font-semibold text-red-700 dark:text-red-300"
        >
          {{ actionMessage }}
        </p>
      </section>
    </template>
  </section>
</template>
