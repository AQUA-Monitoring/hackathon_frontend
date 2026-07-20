<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { useNotificationsStore } from './store'
import type { OperationalAlert, OperationalAlertFilters, OperationalAlertStatus } from './types'

const store = useNotificationsStore()
const filters = reactive<OperationalAlertFilters>({ status: '', region: '', camera: '', page: 1 })
const resolutionNotify = reactive<Record<string, boolean>>({})
const reasons = reactive<Record<string, string>>({})
const expanded = ref<string | null>(null)

const statusLabels: Record<OperationalAlertStatus, string> = {
  OPEN_INDICATION: 'Indício em revisão',
  CONFIRMED: 'Alagamento confirmado',
  DISMISSED: 'Indício descartado',
  RESOLVED: 'Alerta encerrado',
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  )
const percent = (value: number) => `${Math.round(value * (value <= 1 ? 100 : 1))}%`

async function load(page = 1) {
  filters.page = page
  try {
    await store.loadAlerts({
      ...filters,
      region: filters.region || undefined,
      camera: filters.camera || undefined,
    })
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Falha ao carregar alertas.')
  }
}

async function act(alert: OperationalAlert, kind: 'confirm' | 'dismiss' | 'resolve') {
  try {
    if (kind === 'confirm') await store.confirm(alert.id, reasons[alert.id])
    if (kind === 'dismiss') await store.dismiss(alert.id, reasons[alert.id])
    if (kind === 'resolve')
      await store.resolve(alert.id, resolutionNotify[alert.id] ?? true, reasons[alert.id])
    toast.success(
      kind === 'confirm'
        ? 'Alagamento confirmado e notificações agendadas.'
        : kind === 'dismiss'
          ? 'Indício descartado.'
          : 'Alerta encerrado.',
    )
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a ação.')
  }
}

onMounted(() => Promise.all([load(), store.loadOpenCount()]))
</script>

<template>
  <section class="w-full min-w-0 px-5 lg:px-0" aria-labelledby="alerts-title">
    <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-[#2768CA]">Monitoramento</p>
        <h1 id="alerts-title" class="text-2xl font-semibold sm:text-3xl">Alertas operacionais</h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Revise indícios automáticos antes de comunicar um alagamento aos usuários.
        </p>
      </div>
      <div class="rounded-2xl bg-[#2768CA]/10 px-4 py-3 text-center text-[#0750AF] dark:text-blue-200">
        <strong class="block text-2xl">{{ store.openCount }}</strong>
        <span class="text-xs font-medium">indícios abertos</span>
      </div>
    </header>

    <form class="mb-5 grid gap-3 rounded-2xl bg-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-4 dark:bg-white/10" @submit.prevent="load(1)">
      <label class="text-sm font-medium">Estado
        <select v-model="filters.status" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 dark:bg-[#00182F]">
          <option value="">Todos</option><option value="OPEN_INDICATION">Em revisão</option>
          <option value="CONFIRMED">Confirmados</option><option value="RESOLVED">Encerrados</option>
          <option value="DISMISSED">Descartados</option>
        </select>
      </label>
      <label class="text-sm font-medium">ID da região
        <input v-model.trim="filters.region" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 dark:bg-[#00182F]" />
      </label>
      <label class="text-sm font-medium">ID da câmera
        <input v-model.trim="filters.camera" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 dark:bg-[#00182F]" />
      </label>
      <label class="text-sm font-medium">Detectado a partir de
        <input v-model="filters.date_from" type="date" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 dark:bg-[#00182F]" />
      </label>
      <label class="text-sm font-medium">Detectado até
        <input v-model="filters.date_to" type="date" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 dark:bg-[#00182F]" />
      </label>
      <button class="self-end rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2" type="submit">Aplicar filtros</button>
    </form>

    <p v-if="store.loading" role="status" class="py-10 text-center">Carregando alertas…</p>
    <p v-else-if="store.error" role="alert" class="rounded-xl bg-red-50 p-4 text-red-800">{{ store.error }}</p>
    <p v-else-if="!store.page.results.length" class="rounded-2xl border border-dashed border-slate-300 p-10 text-center">Nenhum alerta encontrado.</p>

    <div v-else class="grid gap-4">
      <article v-for="alert in store.page.results" :key="alert.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-[#001C3B]">
        <div class="flex flex-wrap justify-between gap-3">
          <div>
            <span class="inline-flex rounded-full bg-[#2768CA]/10 px-3 py-1 text-xs font-semibold text-[#0750AF] dark:text-blue-200">{{ statusLabels[alert.status] }}</span>
            <h2 class="mt-2 text-lg font-semibold">{{ alert.camera.description }}</h2>
            <p class="text-sm text-slate-600 dark:text-slate-300">{{ alert.region ? `${alert.region.name}, ${alert.region.city.name}` : 'Região canônica não definida' }} · Última análise {{ formatDate(alert.last_detected_at) }}</p>
          </div>
          <div class="text-right"><strong class="text-xl text-[#0750AF] dark:text-blue-200">{{ percent(alert.evidence.confidence) }}</strong><span class="block text-xs">confiança do modelo</span></div>
        </div>

        <button type="button" class="mt-3 text-sm font-semibold text-[#2768CA] underline" :aria-expanded="expanded === alert.id" @click="expanded = expanded === alert.id ? null : alert.id">{{ expanded === alert.id ? 'Ocultar evidências' : 'Revisar evidências' }}</button>
        <div v-if="expanded === alert.id" class="mt-3 grid gap-3 border-t border-slate-200 pt-3 dark:border-white/15">
          <img v-if="alert.evidence.image_url" :src="alert.evidence.image_url" alt="Quadro representativo do indício analisado" class="max-h-72 w-full rounded-xl object-cover" />
          <dl class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><div><dt>Normal</dt><dd class="font-semibold">{{ percent(alert.evidence.probabilities.normal) }}</dd></div><div><dt>Intermediário</dt><dd class="font-semibold">{{ percent(alert.evidence.probabilities.medium) }}</dd></div><div><dt>Alagado</dt><dd class="font-semibold">{{ percent(alert.evidence.probabilities.flooded) }}</dd></div><div><dt>Modelo</dt><dd class="font-semibold">{{ alert.evidence.model_version }}</dd></div></dl>
          <RouterLink :to="alert.camera.detail_path" class="w-fit font-semibold text-[#2768CA] underline">Abrir câmera</RouterLink>
        </div>

        <div v-if="alert.status === 'OPEN_INDICATION' || alert.status === 'CONFIRMED'" class="mt-4 border-t border-slate-200 pt-4 dark:border-white/15">
          <label class="text-sm">Justificativa (opcional)<textarea v-model.trim="reasons[alert.id]" rows="2" class="mt-1 block w-full rounded-xl border border-slate-300 bg-transparent p-2" /></label>
          <label v-if="alert.status === 'CONFIRMED'" class="mt-3 flex items-start gap-2 text-sm"><input v-model="resolutionNotify[alert.id]" :true-value="true" :false-value="false" type="checkbox" class="mt-1" /> Notificar usuários que o alerta foi encerrado</label>
          <div class="mt-3 flex flex-wrap gap-2">
            <button v-if="alert.status === 'OPEN_INDICATION'" type="button" :disabled="store.actionId === alert.id || !alert.region" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white disabled:opacity-50" @click="act(alert, 'confirm')">Confirmar alagamento</button>
            <button v-if="alert.status === 'OPEN_INDICATION'" type="button" :disabled="store.actionId === alert.id" class="rounded-xl border border-red-600 px-4 py-2 font-semibold text-red-700 dark:text-red-300" @click="act(alert, 'dismiss')">Descartar indício</button>
            <button v-if="alert.status === 'CONFIRMED'" type="button" :disabled="store.actionId === alert.id" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white" @click="act(alert, 'resolve')">Encerrar alerta</button>
          </div>
          <p v-if="!alert.region && alert.status === 'OPEN_INDICATION'" class="mt-2 text-sm text-amber-700 dark:text-amber-300">Associe uma região canônica à câmera antes de confirmar.</p>
        </div>
      </article>
    </div>

    <nav v-if="store.page.previous || store.page.next" aria-label="Paginação dos alertas" class="mt-5 flex justify-center gap-3">
      <button :disabled="!store.page.previous" class="rounded-xl border px-4 py-2 disabled:opacity-40" @click="load((filters.page ?? 1) - 1)">Anterior</button>
      <span class="py-2">Página {{ filters.page }}</span>
      <button :disabled="!store.page.next" class="rounded-xl border px-4 py-2 disabled:opacity-40" @click="load((filters.page ?? 1) + 1)">Próxima</button>
    </nav>
  </section>
</template>
