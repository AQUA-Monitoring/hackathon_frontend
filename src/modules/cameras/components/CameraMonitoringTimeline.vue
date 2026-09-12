<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import api from '@/app/plugins/axios'

const props = defineProps<{ cameraId: string }>()
interface Run {
  id: string; started_at: string; level: string; model_version: string; error_code: string
  frames: Array<{ normal: number; medium: number; flooded: number }>
  evidence: Array<{ id: string; url: string; sha256: string }>
}
const runs = ref<Run[]>([])
const level = ref('WATCH')
const currentLevel = ref('NORMAL')
const reason = ref('')
const error = ref('')
const busy = ref(false)
const preview = ref('')
const selectedRun = ref('')
const classification = ref('FLOOD_INDICATION')
let requestId = 0

async function load() {
  const id = ++requestId
  error.value = ''
  try {
    const { data } = await api.get(`/flood_monitoring/cameras/${props.cameraId}/monitoring/`)
    if (id !== requestId) return
    runs.value = data.runs
    currentLevel.value = data.monitoring?.level ?? 'NORMAL'
  } catch {
    if (id === requestId) error.value = 'Não foi possível carregar o histórico de monitoramento.'
  }
}
async function changeIntensity() {
  if (!reason.value.trim()) return
  busy.value = true
  try {
    await api.post(`/flood_monitoring/cameras/${props.cameraId}/monitoring/`, {
      level: level.value, reason: reason.value, minutes: 60,
    })
    await load()
  } catch { error.value = 'Não foi possível alterar a intensidade.' }
  finally { busy.value = false }
}
async function review() {
  if (!selectedRun.value || !reason.value.trim()) return
  busy.value = true
  try {
    await api.post(`/flood_monitoring/analyses/${selectedRun.value}/reviews/`, {
      classification: classification.value, reason: reason.value,
    })
    selectedRun.value = ''
    await load()
  } catch { error.value = 'Não foi possível registrar a revisão.' }
  finally { busy.value = false }
}
async function showEvidence(url: string) {
  const id = requestId
  try {
    const response = await api.get(url.replace(/^\/api/, ''), { responseType: 'blob' })
    if (id !== requestId) return
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = URL.createObjectURL(response.data)
  } catch { error.value = 'Imagem indisponível ou link expirado. Atualize o histórico.' }
}
watch(() => props.cameraId, () => {
  runs.value = []; selectedRun.value = ''
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = ''
  void load()
}, { immediate: true })
onBeforeUnmount(() => { ++requestId; if (preview.value) URL.revokeObjectURL(preview.value) })
</script>

<template>
  <section class="mt-5 space-y-3 rounded-2xl border border-slate-300 p-4 dark:border-slate-700">
    <h3 class="font-semibold">Monitoramento operacional · {{ currentLevel }}</h3>
    <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
    <label class="block text-sm">Justificativa
      <textarea v-model="reason" class="mt-1 w-full rounded border p-2 dark:bg-slate-900" maxlength="500" />
    </label>
    <div class="flex flex-wrap gap-2">
      <select v-model="level" aria-label="Intensidade" class="rounded border p-2 dark:bg-slate-900">
        <option value="NORMAL">Normal</option><option value="WATCH">Observação</option>
        <option value="CRITICAL">Crítico</option><option value="RECOVERY">Recuperação</option>
      </select>
      <button :disabled="busy || !reason.trim()" class="rounded bg-blue-700 p-2 text-white disabled:opacity-50" @click="changeIntensity">Aplicar por 1 hora</button>
      <button class="rounded border p-2" @click="load">Atualizar histórico</button>
    </div>
    <p v-if="!runs.length" class="text-sm">Nenhuma sequência registrada pelo monitoramento adaptativo.</p>
    <ol class="max-h-96 space-y-3 overflow-y-auto">
      <li v-for="run in runs" :key="run.id" class="rounded border border-slate-200 p-3 dark:border-slate-700">
        <p>{{ new Date(run.started_at).toLocaleString('pt-BR') }} · {{ run.level }}</p>
        <p class="text-xs">Modelo {{ run.model_version || 'indisponível' }} · {{ run.frames.length }} frames</p>
        <p v-if="run.error_code" class="text-sm text-amber-700">Falha: {{ run.error_code }}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button v-for="(item, index) in run.evidence" :key="item.id" class="rounded border p-2 text-sm" @click="showEvidence(item.url)">Imagem {{ index + 1 }}</button>
          <button class="rounded border p-2 text-sm" @click="selectedRun = run.id">Corrigir classificação</button>
        </div>
      </li>
    </ol>
    <img v-if="preview" :src="preview" alt="Evidência da sequência selecionada" class="w-full rounded" />
    <div v-if="selectedRun" class="space-y-2">
      <p class="text-sm">A correção entra na fila de revisão antes de ser usada em treinamento.</p>
      <select v-model="classification" aria-label="Classificação revisada" class="rounded border p-2 dark:bg-slate-900">
        <option value="FLOOD_INDICATION">Alagamento</option><option value="INTERMEDIATE_INDICATION">Intermediário</option>
        <option value="NO_INDICATION">Sem indício</option><option value="UNUSABLE">Imagem inutilizável</option>
      </select>
      <button :disabled="busy || !reason.trim()" class="rounded bg-blue-700 p-2 text-white disabled:opacity-50" @click="review">Registrar correção</button>
    </div>
  </section>
</template>
