<script setup lang="ts">
import { computed } from 'vue'
import { HlsPlayer } from '@/components'
import { useFloodDemo } from '@/composables/useFloodDemo'
import type { FloodDemoStatus } from '@/types/floodDemo'

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
    message: 'A transmissão de demonstração está desativada no momento.',
    icon: 'power_settings_new',
  },
  starting: {
    label: 'Preparando transmissão',
    message: 'O vídeo está sendo preparado. A transmissão começará em instantes.',
    icon: 'hourglass_top',
  },
  ready: {
    label: 'Ao vivo',
    message: 'Transmissão disponível para análise.',
    icon: 'sensors',
  },
  unavailable: {
    label: 'Serviço indisponível',
    message: 'O serviço responsável pela transmissão não está disponível.',
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

const probabilityRows = computed(() => {
  const probabilities = prediction.value?.prediction.probabilities ?? {}
  return ['normal', 'medium', 'flooded'].map((state) => ({
    state,
    value: Math.min(100, Math.max(0, Number(probabilities[state] ?? 0))),
  }))
})

function stateLabel(state?: string | null) {
  const labels: Record<string, string> = {
    auto: 'Automático',
    normal: 'Normal',
    medium: 'Moderado',
    flooded: 'Alagado',
    unknown: '—',
  }
  return state ? (labels[state] ?? state) : '—'
}

function statusTone(status?: FloodDemoStatus) {
  if (status === 'ready')
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  if (status === 'starting')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
}

function probabilityColor(state: string) {
  if (state === 'normal') return 'bg-emerald-500'
  if (state === 'medium') return 'bg-amber-500'
  return 'bg-blue-600'
}
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:py-10">
    <header class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-2 text-sm font-semibold tracking-[0.18em] text-[#2768CA] uppercase">
          Validação do modelo
        </p>
        <h1 class="text-3xl font-semibold sm:text-4xl">Transmissão demo</h1>
        <p class="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
          Acompanhe a análise de alagamentos em tempo real, sem gerar alertas operacionais.
        </p>
      </div>

      <div
        v-if="stream"
        class="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
        :class="statusTone(stream.status)"
      >
        <span class="material-symbols-outlined text-lg">{{ currentStatus.icon }}</span>
        {{ currentStatus.label }}
      </div>
    </header>

    <div
      v-if="pageError"
      role="alert"
      class="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      <span>{{ pageError }}</span>
      <button class="font-semibold underline" @click="refresh">Tentar novamente</button>
    </div>

    <div
      v-if="loading && !stream"
      class="grid min-h-80 place-items-center rounded-3xl bg-slate-100 dark:bg-slate-900"
    >
      <div class="text-center text-slate-500">
        <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
        <p class="mt-2">Consultando transmissão...</p>
      </div>
    </div>

    <template v-else-if="stream">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <div class="overflow-hidden rounded-3xl bg-black shadow-xl">
          <div v-if="isReady" class="aspect-video">
            <HlsPlayer
              :key="stream.session_id ?? stream.hls_url ?? 'demo-stream'"
              :src="stream.hls_url!"
              :muted="true"
              :controls="true"
              :lock-to-live="true"
              :live-delay="3"
              :max-delay-sec="20"
            />
          </div>
          <div
            v-else
            class="grid aspect-video place-items-center bg-slate-950 px-8 text-center text-white"
          >
            <div>
              <span class="material-symbols-outlined mb-3 text-5xl text-slate-400">{{
                currentStatus.icon
              }}</span>
              <h2 class="text-xl font-semibold">{{ currentStatus.label }}</h2>
              <p class="mt-2 max-w-md text-sm text-slate-300">{{ currentStatus.message }}</p>
            </div>
          </div>
        </div>

        <aside
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-xl font-semibold">Transmissão</h2>
            <span class="text-xs text-slate-500">Atualização automática</span>
          </div>
          <dl class="mt-6 grid gap-4 text-sm">
            <div
              class="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800"
            >
              <dt class="text-slate-500 dark:text-slate-400">Estado selecionado</dt>
              <dd class="text-right font-semibold">{{ stateLabel(stream.demo_state) }}</dd>
            </div>
            <div
              class="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800"
            >
              <dt class="text-slate-500 dark:text-slate-400">Fase atual</dt>
              <dd class="text-right font-semibold">{{ stream.current_phase || 'Aguardando' }}</dd>
            </div>
            <div
              class="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800"
            >
              <dt class="text-slate-500 dark:text-slate-400">Segmento</dt>
              <dd class="text-right font-semibold">{{ stream.segment?.sequence ?? '—' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-slate-500 dark:text-slate-400">Fase analisada</dt>
              <dd class="text-right font-semibold">{{ stream.segment?.phase || 'Aguardando' }}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-xl font-semibold">Probabilidades</h2>
            <span
              v-if="predictionLoading"
              class="material-symbols-outlined animate-spin text-slate-400"
              >progress_activity</span
            >
            <span v-else-if="prediction" class="text-xs text-slate-500"
              >{{ prediction.prediction.frames }} frames</span
            >
          </div>

          <div v-if="prediction" class="mt-6 grid gap-5">
            <div v-for="item in probabilityRows" :key="item.state">
              <div class="mb-2 flex justify-between text-sm">
                <span class="font-medium">{{ stateLabel(item.state) }}</span>
                <span class="font-semibold">{{ item.value.toFixed(2) }}%</span>
              </div>
              <div
                class="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                :aria-label="`Probabilidade ${stateLabel(item.state)}`"
                :aria-valuenow="item.value"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="probabilityColor(item.state)"
                  :style="{ width: `${item.value}%` }"
                />
              </div>
            </div>
          </div>
          <p
            v-else
            class="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {{ predictionMessage || 'Aguardando a primeira análise do modelo.' }}
          </p>
          <p
            v-if="prediction && predictionMessage"
            class="mt-4 text-sm text-amber-700 dark:text-amber-300"
          >
            {{ predictionMessage }}
          </p>
        </section>

        <section
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <h2 class="text-xl font-semibold">Resultado da validação</h2>

          <div v-if="prediction" class="mt-6">
            <div
              class="mb-5 flex items-center gap-3 rounded-2xl p-4 font-semibold"
              :class="
                prediction.validation.match === true
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : prediction.validation.match === false
                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
              "
            >
              <span class="material-symbols-outlined">
                {{
                  prediction.validation.match === true
                    ? 'check_circle'
                    : prediction.validation.match === false
                      ? 'warning'
                      : 'info'
                }}
              </span>
              {{
                prediction.validation.match === true
                  ? 'Resultado correspondente'
                  : prediction.validation.match === false
                    ? 'Resultado divergente do esperado'
                    : 'Sem estado esperado para comparação'
              }}
            </div>

            <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <dt class="text-slate-500 dark:text-slate-400">Esperado</dt>
                <dd class="mt-1 font-semibold">{{ stateLabel(prediction.validation.expected) }}</dd>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <dt class="text-slate-500 dark:text-slate-400">Previsto</dt>
                <dd class="mt-1 font-semibold">{{ stateLabel(prediction.validation.actual) }}</dd>
              </div>
              <div class="col-span-2 rounded-2xl bg-slate-50 p-4 sm:col-span-1 dark:bg-slate-800">
                <dt class="text-slate-500 dark:text-slate-400">Confiança</dt>
                <dd class="mt-1 font-semibold">
                  {{ prediction.prediction.confidence.toFixed(2) }}%
                </dd>
              </div>
            </dl>

            <div
              v-if="!prediction.model.ready"
              role="alert"
              class="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              O modelo ainda não está pronto. Este resultado pode estar indisponível ou incompleto.
            </div>
            <p v-else class="mt-4 text-xs text-slate-500">
              Modelo {{ prediction.model.version
              }}<span v-if="prediction.model.fallback"> · modo alternativo</span>
            </p>
          </div>
          <p v-else class="mt-6 text-sm text-slate-500">
            A validação aparecerá após a primeira predição.
          </p>
        </section>
      </div>

      <section
        v-if="isAdmin && stream.available_states.length"
        class="mt-6 rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-6 dark:border-blue-900 dark:bg-blue-950/30"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold">Controles administrativos</h2>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Alterar o estado reinicia a transmissão e invalida a predição anterior.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="state in stream.available_states"
              :key="state"
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              :class="
                stream.demo_state === state
                  ? 'bg-[#2768CA] text-white shadow-sm'
                  : 'border border-blue-200 bg-white text-[#2768CA] hover:bg-blue-100 dark:border-blue-800 dark:bg-slate-900 dark:hover:bg-blue-950'
              "
              :disabled="!!changingState || stream.demo_state === state"
              @click="changeState(state)"
            >
              {{ changingState === state ? 'Alterando...' : stateLabel(state) }}
            </button>
          </div>
        </div>
        <p
          v-if="actionMessage"
          role="alert"
          class="mt-4 text-sm font-medium text-red-700 dark:text-red-300"
        >
          {{ actionMessage }}
        </p>
      </section>
    </template>
  </section>
</template>
