<script setup lang="ts">
import { computed } from 'vue'
import { datasetLabel, formatDate } from '../presentation'
import type { FloodEventHistory, FloodEventHistoryEntry, FloodImpactRunSummary } from '../types/floodImpact'

const props = defineProps<{
  history: FloodEventHistory | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{ retry: [] }>()

const entries = computed(() => {
  const result = [...(props.history?.entries ?? [])]
  return result.sort((left, right) => {
    const a = left.created_at ? new Date(left.created_at).getTime() : 0
    const b = right.created_at ? new Date(right.created_at).getTime() : 0
    return b - a
  })
})

function actorLabel(entry: FloodEventHistoryEntry) {
  if (!entry.actor) return 'Responsável não informado'
  if (typeof entry.actor === 'string') return entry.actor
  return entry.actor.name || entry.actor.email || entry.actor.id || 'Responsável não informado'
}

function entryTitle(entry: FloodEventHistoryEntry) {
  if (entry.kind === 'REVIEW') return entry.decision === 'PUBLISH' ? 'Revisão para publicação' : 'Revisão para revogação'
  if (entry.kind === 'CONFIRMATION') return 'Confirmação administrativa'
  if (entry.kind === 'IMPACT_RUN') return 'Cálculo de impacto'
  if (entry.kind === 'REVISION') return `Revisão territorial ${entry.revision ?? entry.number ?? ''}`.trim()
  return entry.action || entry.kind || 'Alteração do evento'
}

function runFromEntry(entry: FloodEventHistoryEntry): FloodImpactRunSummary | null {
  if (entry.kind !== 'IMPACT_RUN') return null
  return {
    id: entry.id,
    status: entry.status ?? 'Não informado',
    dataset: entry.dataset,
    algorithm_version: entry.algorithm_version,
    report: entry.report,
  }
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#071F36]" aria-labelledby="audit-title">
    <h2 id="audit-title" class="font-semibold">Trilha auditável do evento</h2>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Revisões, decisões, confirmações e cálculos permanecem separados.</p>

    <div v-if="loading" class="mt-4 space-y-2" role="status" aria-label="Carregando histórico auditável">
      <div v-for="item in 3" :key="item" class="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"></div>
    </div>
    <div v-else-if="error" class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="mt-2 font-semibold text-[#2768CA] underline underline-offset-2" @click="emit('retry')">Tentar carregar a auditoria novamente</button>
    </div>
    <p v-else-if="entries.length === 0" class="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">Ainda não há entradas auditáveis informadas.</p>
    <ol v-else class="mt-4 space-y-3">
      <li v-for="entry in entries" :key="`${entry.kind}-${entry.id}`" class="relative rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <p class="font-semibold">{{ entryTitle(entry) }}</p>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{{ entry.status || entry.decision || 'Registrado' }}</span>
        </div>
        <p class="mt-1 text-xs text-slate-600 dark:text-slate-300">{{ formatDate(entry.created_at) }} · {{ actorLabel(entry) }}</p>
        <p v-if="entry.justification" class="mt-2">{{ entry.justification }}</p>
        <p v-if="entry.reference_base_revision || entry.source_revision" class="mt-1 text-xs text-slate-500">Base de referência: {{ entry.reference_base_revision || entry.source_revision }}</p>
        <p v-if="runFromEntry(entry)" class="mt-1 text-xs text-slate-500">{{ datasetLabel(runFromEntry(entry)) }} · algoritmo {{ entry.algorithm_version || 'não informado' }}</p>
      </li>
    </ol>
  </section>
</template>
