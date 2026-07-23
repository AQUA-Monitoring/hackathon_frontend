<script setup lang="ts">
import { computed } from 'vue'
import {
  datasetLabel,
  evidenceLabels,
  formatDate,
  freshnessLabels,
  statusLabels,
} from '../presentation'
import type { AffectedAreaReference, FloodSpatialEvent } from '../types/floodImpact'

const props = defineProps<{ event: FloodSpatialEvent }>()

const emit = defineEmits<{
  revise: []
  publish: []
  revoke: []
  confirm: []
  recalculate: []
}>()

function names(items?: AffectedAreaReference[] | null) {
  return items?.map((item) => item.name).filter(Boolean).join(', ') || 'Não informado'
}

const permissions = computed(() => ({
  canEdit: (props.event.permissions?.can_edit ?? false)
    && props.event.evidence_kind !== 'CONFIRMED_OCCURRENCE'
    && props.event.evidence_kind !== 'LEGACY_UNCLASSIFIED',
  canReview: props.event.permissions?.can_review ?? false,
  canConfirm: (props.event.permissions?.can_confirm ?? false)
    && props.event.evidence_kind !== 'CONFIRMED_OCCURRENCE',
  canRecalculate: props.event.permissions?.can_recalculate ?? false,
}))
</script>

<template>
  <article class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#071F36]" aria-labelledby="selected-event-title">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold tracking-wide text-[#2768CA] uppercase">Evento selecionado</p>
        <h2 id="selected-event-title" class="mt-1 text-lg font-semibold">{{ event.city_name || 'Cidade não informada' }}</h2>
      </div>
      <div class="flex flex-wrap gap-1.5 text-xs">
        <span class="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-900">{{ evidenceLabels[event.evidence_kind] }}</span>
        <span class="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">{{ statusLabels[event.status] }}</span>
        <span v-if="event.freshness" class="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-900">{{ freshnessLabels[event.freshness] }}</span>
      </div>
    </div>

    <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      <div><dt class="text-slate-500">Vigência</dt><dd class="font-medium">{{ formatDate(event.valid_from) }} — {{ formatDate(event.valid_until) }}</dd></div>
      <div><dt class="text-slate-500">Revisões</dt><dd class="font-medium">Evento {{ event.current_revision ?? 'legado' }} · Base {{ event.reference_base_revision || 'não informada' }}</dd></div>
      <div><dt class="text-slate-500">Regiões derivadas</dt><dd class="font-medium">{{ names(event.affected_regions) }}</dd></div>
      <div><dt class="text-slate-500">Ruas derivadas</dt><dd class="font-medium">{{ names(event.affected_streets) }}</dd></div>
    </dl>

    <div class="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
      <p class="font-semibold">Último cálculo</p>
      <template v-if="event.current_run_summary">
        <p class="mt-1">{{ datasetLabel(event.current_run_summary) }}</p>
        <p class="mt-1 text-xs text-slate-600 dark:text-slate-300">
          Estado {{ event.current_run_summary.status }} · algoritmo {{ event.current_run_summary.algorithm_version || 'não informado' }} ·
          {{ formatDate(event.current_run_summary.calculated_at ?? event.current_run_summary.finished_at) }}
        </p>
      </template>
      <p v-else class="mt-1 text-slate-600 dark:text-slate-300">Nenhum resumo de cálculo foi informado.</p>
    </div>

    <div class="mt-4 flex flex-wrap gap-2" aria-label="Ações auditáveis do evento">
      <button v-if="permissions.canEdit" type="button" class="rounded-xl border border-[#2768CA] px-3 py-2 text-sm font-semibold text-[#2768CA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA]" @click="emit('revise')">Criar revisão</button>
      <button v-if="permissions.canReview && event.status === 'DRAFT'" type="button" class="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" @click="emit('publish')">Revisar e publicar</button>
      <button v-if="permissions.canReview && event.status === 'ACTIVE'" type="button" class="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" @click="emit('revoke')">Revisar e revogar</button>
      <button v-if="permissions.canConfirm" type="button" class="rounded-xl border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:text-emerald-300" @click="emit('confirm')">Registrar confirmação separada</button>
      <button v-if="permissions.canRecalculate" type="button" class="rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700" @click="emit('recalculate')">Solicitar novo cálculo</button>
    </div>
  </article>
</template>
