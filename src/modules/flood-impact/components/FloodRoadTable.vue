<script setup lang="ts">
import { formatDate, formatFraction, formatLength, relationLabels } from '../presentation'
import type { PageState, RoadFloodImpact } from '../types/floodImpact'
import FloodImpactPagination from './FloodImpactPagination.vue'

defineProps<{
  roads: RoadFloodImpact[]
  page: PageState
  loading: boolean
  refreshing: boolean
  error: string | null
}>()

const emit = defineEmits<{
  retry: []
  page: [page: number]
}>()

function provenanceLabel(road: RoadFloodImpact) {
  const dataset = typeof road.dataset === 'string'
    ? road.dataset
    : road.dataset?.name ?? road.dataset?.title ?? 'Malha não informada'
  const release = typeof road.dataset === 'object'
    ? road.dataset?.release ?? road.dataset?.version ?? road.dataset?.source_version
    : undefined
  return [dataset, release].filter(Boolean).join(' · ')
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#071F36]" aria-labelledby="road-table-title">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 id="road-table-title" class="font-semibold">Trechos calculados</h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Lista equivalente ao mapa, com medida e origem do cálculo.</p>
      </div>
      <span v-if="refreshing" class="text-xs text-slate-500" role="status">Atualizando trechos…</span>
    </div>

    <div v-if="loading" class="mt-4 h-36 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" role="status" aria-label="Carregando trechos"></div>
    <div v-else-if="error" class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="mt-2 font-semibold text-[#2768CA] underline underline-offset-2" @click="emit('retry')">Tentar carregar os trechos novamente</button>
    </div>
    <p v-else-if="roads.length === 0" class="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Nenhum trecho foi retornado para este cálculo. Isso não comprova via livre nem ausência de alagamento.
    </p>

    <div v-else class="mt-4 overflow-x-auto">
      <table class="min-w-full border-separate border-spacing-0 text-left text-sm">
        <caption class="sr-only">Trechos viários intersectados pela mancha territorial</caption>
        <thead>
          <tr class="text-xs text-slate-500 uppercase">
            <th scope="col" class="border-b border-slate-200 px-3 py-2">Rua</th>
            <th scope="col" class="border-b border-slate-200 px-3 py-2">Relação</th>
            <th scope="col" class="border-b border-slate-200 px-3 py-2">Comprimento</th>
            <th scope="col" class="border-b border-slate-200 px-3 py-2">Fração do segmento</th>
            <th scope="col" class="border-b border-slate-200 px-3 py-2">Proveniência</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="road in roads" :key="road.id" class="align-top">
            <th scope="row" class="border-b border-slate-100 px-3 py-3 font-semibold dark:border-slate-800">
              {{ road.street_name ?? road.street?.name ?? 'Trecho sem nome' }}
            </th>
            <td class="border-b border-slate-100 px-3 py-3 dark:border-slate-800">{{ relationLabels[road.relation] }}</td>
            <td class="border-b border-slate-100 px-3 py-3 tabular-nums dark:border-slate-800">{{ formatLength(road.affected_length_m) }}</td>
            <td class="border-b border-slate-100 px-3 py-3 tabular-nums dark:border-slate-800">{{ formatFraction(road.segment_fraction) }}</td>
            <td class="border-b border-slate-100 px-3 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <span class="block font-medium">{{ provenanceLabel(road) }}</span>
              <span class="mt-0.5 block">Algoritmo {{ road.algorithm_version || 'não informado' }}</span>
              <span class="mt-0.5 block">Calculado em {{ formatDate(road.calculated_at) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <FloodImpactPagination
      class="mt-3"
      :page="page"
      :disabled="loading || refreshing"
      label="Paginação de trechos calculados"
      @change="emit('page', $event)"
    />
  </section>
</template>
