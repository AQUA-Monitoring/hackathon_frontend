<script setup lang="ts">
import { evidenceLabels, formatDate, freshnessLabels, statusLabels } from '../presentation'
import type { FloodSpatialEvent, PageState } from '../types/floodImpact'
import FloodImpactPagination from './FloodImpactPagination.vue'

defineProps<{
  events: FloodSpatialEvent[]
  selectedId?: string
  page: PageState
  loading: boolean
  refreshing: boolean
  error: string | null
}>()

const emit = defineEmits<{
  select: [event: FloodSpatialEvent]
  retry: []
  page: [page: number]
}>()
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#071F36]" aria-labelledby="event-list-title">
    <div class="flex items-center justify-between gap-3 px-1">
      <h2 id="event-list-title" class="font-semibold">Eventos atuais</h2>
      <span v-if="refreshing" class="text-xs text-slate-500" role="status">Atualizando…</span>
    </div>

    <div v-if="loading" class="mt-3 space-y-2" role="status" aria-label="Carregando eventos">
      <div v-for="item in 3" :key="item" class="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"></div>
    </div>

    <div v-else-if="error" class="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="mt-2 font-semibold text-[#2768CA] underline underline-offset-2" @click="emit('retry')">
        Tentar carregar eventos novamente
      </button>
    </div>

    <p v-else-if="events.length === 0" class="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Nenhum evento corresponde aos filtros. O mapa não presume resultados ausentes.
    </p>

    <div v-else class="mt-3 max-h-[32rem] space-y-2 overflow-auto pr-1">
      <button
        v-for="event in events"
        :key="event.id"
        type="button"
        class="w-full rounded-xl border p-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA]"
        :class="selectedId === event.id ? 'border-[#2768CA] bg-blue-50 text-slate-950' : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'"
        :aria-pressed="selectedId === event.id"
        @click="emit('select', event)"
      >
        <span class="flex flex-wrap gap-1.5">
          <span class="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-900">{{ evidenceLabels[event.evidence_kind] }}</span>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{{ statusLabels[event.status] }}</span>
          <span v-if="event.freshness" class="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
            {{ freshnessLabels[event.freshness] }}
          </span>
        </span>
        <span class="mt-2 block font-medium">{{ event.city_name || 'Cidade não informada' }}</span>
        <span class="mt-0.5 block text-xs text-slate-600">Vigência: {{ formatDate(event.valid_from) }}</span>
        <span class="mt-0.5 block text-xs text-slate-500">Revisão {{ event.current_revision ?? 'legada' }}</span>
      </button>
    </div>

    <FloodImpactPagination
      class="mt-3"
      :page="page"
      :disabled="loading || refreshing"
      label="Paginação de eventos atuais"
      @change="emit('page', $event)"
    />
  </section>
</template>
