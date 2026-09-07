<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatNullablePercent, HlsPlayer } from '@/modules/cameras'
import { useFloodDemo } from './useFloodDemo'
import DemoSourceManager from './DemoSourceManager.vue'
import {
  floodDemoAnalysisLabel,
  floodDemoProbabilityRows,
  floodDemoResult,
  floodDemoResultTone,
  floodDemoScenarioLabel,
  floodDemoStatusContent,
  floodDemoStatusTone,
  floodDemoTemporalRows,
  hasFloodDemoAnalysis,
} from './floodDemoPresentation'

const {
  stream,
  displayedPrediction,
  displayedPredictionBatch,
  analysisPinned,
  pinnedAnalysisIsPrevious,
  displayedAnalysisIsPrevious,
  pinMessage,
  representativeImageUnavailableMessage,
  displayedRepresentativeImage,
  loading,
  predictionLoading,
  changingState,
  pageError,
  predictionMessage,
  predictionUnavailable,
  actionMessage,
  sources,
  sourcesLoading,
  sourcesMessage,
  uploadingMode,
  uploadProgress,
  isAdmin,
  isSuperuser,
  isReady,
  refresh,
  pinAnalysis,
  resumeLiveAnalysis,
  changeState,
  uploadSource,
  setPlayerSegmentSequence,
} = useFloodDemo()

const MAX_SYNC_LATENCY_SECONDS = 7
const demoPlayer = ref<{ restart: () => void } | null>(null)
const playerLatency = ref<number | null>(null)
const restartMessage = ref<string | null>(null)
const isSeverelyDesynced = computed(
  () => playerLatency.value !== null && playerLatency.value > MAX_SYNC_LATENCY_SECONDS,
)

function restartDemoPlayer() {
  resumeLiveAnalysis()
  restartMessage.value = 'Reiniciando o player e buscando o ponto ao vivo...'
  playerLatency.value = null
  demoPlayer.value?.restart()
  window.setTimeout(() => {
    restartMessage.value = null
  }, 3000)
}

const currentStatus = computed(() =>
  stream.value ? floodDemoStatusContent[stream.value.status] : floodDemoStatusContent.starting,
)
const analysisAvailable = computed(() => hasFloodDemoAnalysis(displayedPrediction.value))
const result = computed(() =>
  floodDemoResult(
    displayedPrediction.value,
    predictionLoading.value && !analysisPinned.value,
    analysisAvailable.value,
    predictionMessage.value,
    predictionUnavailable.value,
  ),
)
const resultTone = computed(() => floodDemoResultTone(result.value.tone))
const probabilityRows = computed(() => floodDemoProbabilityRows(displayedPrediction.value))
const temporalRows = computed(() =>
  floodDemoTemporalRows(displayedPredictionBatch.value, displayedRepresentativeImage),
)
const scenarioLabel = floodDemoScenarioLabel
const analysisLabel = (state?: string | null) =>
  floodDemoAnalysisLabel(state, analysisAvailable.value)
const statusTone = floodDemoStatusTone
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
          <div v-if="isReady" class="relative aspect-video">
            <HlsPlayer
              ref="demoPlayer"
              :key="stream.session_id ?? stream.hls_url ?? 'demo'"
              :src="stream.hls_url ?? ''"
              :muted="true"
              :controls="true"
              :lock-to-live="true"
              :live-delay="3"
              :max-delay-sec="20"
              required-codec='video/mp4; codecs="avc1.64001f"'
              @segment-change="setPlayerSegmentSequence"
              @latency-change="playerLatency = $event"
            />
            <button
              type="button"
              class="absolute top-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#00182F]/90 px-4 text-sm font-semibold text-white shadow-lg ring-1 ring-white/30 backdrop-blur-sm hover:bg-[#00182F] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              @click="restartDemoPlayer"
            >
              <span class="material-symbols-outlined text-lg" aria-hidden="true">restart_alt</span>
              Reiniciar transmissão
            </button>
            <div
              v-if="isSeverelyDesynced"
              role="alert"
              class="absolute right-3 bottom-14 left-3 flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                A transmissão está cerca de {{ Math.ceil(playerLatency ?? 0) }} segundos atrasada.
              </span>
              <button
                type="button"
                class="min-h-11 font-semibold underline"
                @click="restartDemoPlayer"
              >
                Sincronizar agora
              </button>
            </div>
            <p v-if="restartMessage" class="sr-only" role="status" aria-live="polite">
              {{ restartMessage }}
            </p>
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
            <button
              type="button"
              class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-current/30 px-3 text-sm font-semibold hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-black/20 dark:focus-visible:ring-offset-[#001C3B]"
              :disabled="
                !analysisPinned && (!analysisAvailable || displayedPredictionBatch === null)
              "
              :aria-pressed="analysisPinned"
              @click="analysisPinned ? resumeLiveAnalysis() : pinAnalysis()"
            >
              <span class="material-symbols-outlined text-lg" aria-hidden="true">
                {{ analysisPinned ? 'play_arrow' : 'keep' }}
              </span>
              {{ analysisPinned ? 'Voltar ao vivo' : 'Fixar análise' }}
            </button>
          </div>
          <p
            v-if="analysisPinned"
            class="mt-4 rounded-xl border border-current/20 bg-white/50 px-3 py-2 text-sm font-semibold dark:bg-black/20"
            role="status"
            aria-live="polite"
          >
            Análise fixada para leitura — o vídeo continua ao vivo
          </p>
          <p v-if="pinnedAnalysisIsPrevious" class="mt-2 text-sm">
            A análise fixada é anterior ao trecho ao vivo atual.
          </p>
          <p
            v-if="displayedAnalysisIsPrevious"
            class="mt-4 rounded-xl border border-current/20 bg-white/50 px-3 py-2 text-sm font-semibold dark:bg-black/20"
            role="status"
            aria-live="polite"
          >
            Trecho anterior — atualizando análise
          </p>
          <p
            v-if="pinMessage"
            class="mt-2 text-sm font-semibold"
            role="alert"
            aria-live="assertive"
          >
            {{ pinMessage }}
          </p>
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
            v-if="predictionMessage && displayedPrediction && !analysisPinned"
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
          <div v-if="displayedPrediction" class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-4 dark:bg-[#071F36]">
              <p class="text-xs text-slate-500 dark:text-slate-400">Esperado no cenário</p>
              <p class="mt-1 font-semibold">
                {{ scenarioLabel(displayedPrediction.validation.expected) }}
              </p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4 dark:bg-[#071F36]">
              <p class="text-xs text-slate-500 dark:text-slate-400">Analisado pelo modelo</p>
              <p class="mt-1 font-semibold">
                {{ analysisLabel(displayedPrediction.validation.actual) }}
              </p>
            </div>
            <p
              class="sm:col-span-2 rounded-2xl p-4 text-sm font-semibold"
              :class="
                displayedPrediction.validation.match === true
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : displayedPrediction.validation.match === false
                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
              "
            >
              {{
                displayedPrediction.validation.match === true
                  ? 'Resultado correspondente ao cenário'
                  : displayedPrediction.validation.match === false
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
            <section
              class="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800"
              aria-labelledby="demo-temporal-title"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 id="demo-temporal-title" class="font-semibold">
                    Evolução recente da análise
                  </h3>
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Três segmentos cronológicos; o trecho exibido mantém o resultado principal.
                  </p>
                </div>
                <span
                  v-if="displayedPredictionBatch?.partial"
                  class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                >
                  Evolução parcial
                </span>
              </div>
              <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3" aria-live="polite">
                <article
                  v-for="item in temporalRows"
                  :key="item.offset"
                  class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#071F36]"
                >
                  <h4 class="text-sm font-semibold">{{ item.label }}</h4>
                  <p class="mt-2 min-h-10 text-xs text-slate-600 dark:text-slate-300">
                    {{ item.statusLabel }}
                  </p>
                  <figure v-if="item.representativeImage.url" class="mt-3">
                    <img
                      :src="item.representativeImage.url"
                      :alt="`Quadro representativo do ${(item.label ?? 'trecho').toLocaleLowerCase('pt-BR')}`"
                      class="aspect-video w-full rounded-xl border border-slate-200 bg-slate-200 object-cover dark:border-slate-600 dark:bg-slate-800"
                    />
                    <figcaption class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Quadro representativo da amostragem
                    </figcaption>
                  </figure>
                  <p
                    v-else-if="item.representativeImage.unavailable"
                    class="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    role="status"
                  >
                    {{ representativeImageUnavailableMessage }}
                  </p>
                  <dl v-if="item.probabilities.length" class="mt-3 grid gap-2 text-xs">
                    <div
                      v-for="probability in item.probabilities"
                      :key="probability.state"
                      class="flex justify-between gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-800"
                    >
                      <dt class="text-slate-500 dark:text-slate-400">
                        {{ probability.label }}
                      </dt>
                      <dd class="font-semibold">
                        {{ formatNullablePercent(probability.value) }}
                      </dd>
                    </div>
                  </dl>
                  <p
                    v-else
                    class="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  >
                    Probabilidades não disponíveis.
                  </p>
                </article>
              </div>
            </section>
            <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-slate-500">Confiança</dt>
                <dd class="font-semibold">
                  {{
                    formatNullablePercent(
                      analysisAvailable
                        ? (displayedPrediction?.prediction.confidence ?? null)
                        : null,
                    )
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Frames</dt>
                <dd class="font-semibold">
                  {{
                    analysisAvailable
                      ? (displayedPrediction?.prediction.frames ?? 'Não disponível')
                      : 'Não disponível'
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Modelo</dt>
                <dd class="font-semibold">
                  {{
                    analysisAvailable
                      ? 'Disponível'
                      : predictionUnavailable
                        ? 'Análise indisponível'
                        : 'Aguardando análise'
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Versão</dt>
                <dd class="break-all font-semibold">
                  {{
                    analysisAvailable
                      ? (displayedPrediction?.model.version ?? 'Não disponível')
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
              :aria-pressed="stream.demo_state === state"
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

    <DemoSourceManager
      v-if="isAdmin"
      :sources="sources"
      :loading="sourcesLoading"
      :message="sourcesMessage"
      :can-upload="isSuperuser"
      :uploading-mode="uploadingMode"
      :upload-progress="uploadProgress"
      @upload="uploadSource"
    />
  </section>
</template>
