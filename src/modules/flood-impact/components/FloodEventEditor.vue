<script setup lang="ts">
import { reactive, watch } from 'vue'
import { creatableEvidenceOptions, formatDate } from '../presentation'
import type { CreatableFloodEvidenceKind, FloodSpatialEvent } from '../types/floodImpact'

export interface FloodEventEditorValue {
  city: string
  evidenceKind: CreatableFloodEvidenceKind
  confidence: number | null
  validFrom: string
  validUntil: string
  source: string
  justification: string
}

const props = defineProps<{
  cities: Array<{ id: string; name: string }>
  event?: FloodSpatialEvent | null
  footprintReady: boolean
  submitting: boolean
  message?: string | null
}>()

const emit = defineEmits<{
  submit: [value: FloodEventEditorValue]
  cancel: []
}>()

const form = reactive<FloodEventEditorValue>({
  city: '',
  evidenceKind: 'CAMERA_OBSERVATION',
  confidence: null,
  validFrom: localDateTimeValue(),
  validUntil: '',
  source: '',
  justification: '',
})

function localDateTimeValue(value: string | Date = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

watch(() => props.event, (event) => {
  form.city = event?.city ?? ''
  form.evidenceKind = event?.evidence_kind === 'FORECAST'
    || event?.evidence_kind === 'CAMERA_OBSERVATION'
    || event?.evidence_kind === 'USER_REPORT'
    ? event.evidence_kind
    : 'CAMERA_OBSERVATION'
  form.confidence = event?.confidence ?? null
  form.validFrom = event?.valid_from ? localDateTimeValue(event.valid_from) : localDateTimeValue()
  form.validUntil = event?.valid_until ? localDateTimeValue(event.valid_until) : ''
  form.source = typeof event?.source === 'string' ? event.source : ''
  form.justification = ''
}, { immediate: true })

function submit() {
  if (!form.city || !form.validFrom || !props.footprintReady) return
  if (props.event && !form.justification.trim()) return
  emit('submit', { ...form })
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#071F36]" aria-labelledby="editor-title">
    <p class="text-xs font-semibold tracking-wide text-[#2768CA] uppercase">Fluxo guiado</p>
    <h2 id="editor-title" class="mt-1 text-lg font-semibold">{{ event ? 'Criar revisão territorial' : 'Criar evento' }}</h2>
    <ol class="mt-4 grid grid-cols-3 gap-2 text-xs" aria-label="Etapas de criação">
      <li class="rounded-lg bg-blue-50 p-2 font-semibold text-blue-900"><span class="block">1</span>Contexto</li>
      <li class="rounded-lg bg-blue-50 p-2 font-semibold text-blue-900"><span class="block">2</span>Mancha</li>
      <li class="rounded-lg bg-blue-50 p-2 font-semibold text-blue-900"><span class="block">3</span>Revisão</li>
    </ol>

    <p v-if="event" class="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
      Editando a partir da revisão {{ event.current_revision ?? 'legada' }}, vigente desde {{ formatDate(event.valid_from) }}.
      O salvamento cria uma nova revisão; não sobrescreve a anterior.
    </p>

    <form class="mt-4 grid gap-3" @submit.prevent="submit">
      <label class="text-sm font-medium">Cidade
        <select v-model="form.city" required :disabled="!!event" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 disabled:bg-slate-100">
          <option value="">Selecione</option>
          <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
        </select>
      </label>
      <label class="text-sm font-medium">Natureza da evidência
        <select v-model="form.evidenceKind" required :disabled="!!event" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 disabled:bg-slate-100">
          <option v-for="option in creatableEvidenceOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm font-medium">Válida desde
          <input v-model="form.validFrom" required type="datetime-local" :disabled="!!event" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 disabled:bg-slate-100" />
        </label>
        <label class="text-sm font-medium">Válida até
          <input v-model="form.validUntil" type="datetime-local" :disabled="!!event" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 disabled:bg-slate-100" />
        </label>
      </div>
      <label v-if="!event" class="text-sm font-medium">Fonte ou referência
        <input v-model="form.source" type="text" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900" placeholder="Ex.: inspeção operacional" />
      </label>
      <label v-if="event" class="text-sm font-medium">Justificativa da revisão
        <textarea v-model="form.justification" required rows="3" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900" placeholder="Descreva por que a geometria precisa mudar"></textarea>
      </label>

      <div class="rounded-xl border p-3 text-sm" :class="footprintReady ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-amber-300 bg-amber-50 text-amber-950'" role="status">
        {{ footprintReady ? 'Mancha desenhada e pronta para revisão.' : 'Etapa 2 pendente: desenhe a mancha no mapa.' }}
      </div>
      <p v-if="message" class="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900" role="alert">{{ message }}</p>

      <div class="flex flex-wrap justify-end gap-2">
        <button type="button" class="rounded-xl px-4 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800" @click="emit('cancel')">Cancelar</button>
        <button type="submit" :disabled="submitting || !footprintReady" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {{ submitting ? 'Salvando…' : event ? 'Salvar nova revisão' : 'Salvar como rascunho' }}
        </button>
      </div>
    </form>
  </section>
</template>
