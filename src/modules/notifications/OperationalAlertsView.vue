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

const statusStyles: Record<OperationalAlertStatus, string> = {
  OPEN_INDICATION: 'bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-200',
  CONFIRMED: 'bg-red-100 text-red-900 dark:bg-red-300/15 dark:text-red-200',
  DISMISSED: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  RESOLVED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-300/15 dark:text-emerald-200',
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
  <section class="w-full min-w-0 px-4 py-5 sm:px-6 lg:px-0" aria-labelledby="alerts-title">
    <header class="mb-6 rounded-3xl bg-gradient-to-br from-[#00182F] to-[#0750AF] p-5 text-white shadow-lg sm:p-7">
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div class="max-w-2xl">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Central operacional</p>
          <h1 id="alerts-title" class="mt-2 text-2xl font-semibold sm:text-3xl">Revisão de indícios</h1>
          <p class="mt-2 text-sm leading-6 text-blue-100">
            Avalie a evidência da câmera antes de publicar uma comunicação regional.
          </p>
        </div>
        <div class="min-w-36 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center backdrop-blur">
          <strong class="block text-3xl">{{ store.openCount }}</strong>
          <span class="text-xs font-medium text-blue-100">indícios em revisão</span>
        </div>
      </div>
    </header>

    <form class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#001C3B]"
      @submit.prevent="load(1)">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="font-semibold">Filtrar alertas</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Encontre rapidamente uma câmera ou período.</p>
        </div>
        <button type="submit"
          class="rounded-xl bg-[#2768CA] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0750AF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA]">Aplicar
          filtros</button>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label class="text-sm font-medium" for="alert-status">Estado
          <select id="alert-status" v-model="filters.status"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-[#00182F]">
            <option value="">Todos</option>
            <option value="OPEN_INDICATION">Em revisão</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="RESOLVED">Encerrados</option>
            <option value="DISMISSED">Descartados</option>
          </select>
        </label>
        <label class="text-sm font-medium" for="alert-region">ID da região
          <input id="alert-region" v-model.trim="filters.region"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-[#00182F]" />
        </label>
        <label class="text-sm font-medium" for="alert-camera">ID da câmera
          <input id="alert-camera" v-model.trim="filters.camera"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-[#00182F]" />
        </label>
        <label class="text-sm font-medium" for="alert-date-from">A partir de
          <input id="alert-date-from" v-model="filters.date_from" type="date"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-[#00182F]" />
        </label>
        <label class="text-sm font-medium" for="alert-date-to">Até
          <input id="alert-date-to" v-model="filters.date_to" type="date"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-[#00182F]" />
        </label>
      </div>
    </form>

    <p v-if="store.loading" role="status"
      class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm dark:border-white/10 dark:bg-[#001C3B] dark:text-slate-300">
      Carregando alertas…</p>
    <p v-else-if="store.error" role="alert"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      {{ store.error }}</p>
    <p v-else-if="!store.page.results.length"
      class="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600 dark:border-white/20 dark:text-slate-300">
      Nenhum alerta encontrado com esses filtros.</p>

    <div v-else class="grid gap-4">
      <article v-for="alert in store.page.results" :key="alert.id"
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#001C3B]">
        <div class="p-5 sm:p-6">
          <div class="flex flex-wrap justify-between gap-4">
            <div class="min-w-0">
              <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-semibold', statusStyles[alert.status]]">{{
                statusLabels[alert.status] }}</span>
              <h2 class="mt-3 truncate text-lg font-semibold sm:text-xl">{{ alert.camera.description }}</h2>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Última análise {{
                formatDate(alert.last_detected_at) }}</p>
            </div>
            <div
              class="rounded-2xl bg-[#2768CA]/10 px-4 py-2 text-right text-[#0750AF] dark:bg-blue-300/10 dark:text-blue-200">
              <strong class="block text-2xl">{{ percent(alert.evidence.confidence) }}</strong>
              <span class="text-xs">confiança do modelo</span>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span v-if="alert.region"
              class="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-white/10 dark:text-slate-200">{{
                alert.region.name }} · {{ alert.region.city.name }}</span>
            <span v-else
              class="rounded-lg bg-amber-50 px-3 py-1.5 font-medium text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">Localização
              territorial pendente</span>
            <RouterLink :to="alert.camera.detail_path"
              class="font-semibold text-[#2768CA] underline-offset-4 hover:underline dark:text-blue-200">Abrir câmera
            </RouterLink>
          </div>

          <button type="button"
            class="mt-4 rounded-lg text-sm font-semibold text-[#2768CA] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA] dark:text-blue-200"
            :aria-expanded="expanded === alert.id" @click="expanded = expanded === alert.id ? null : alert.id">{{
              expanded === alert.id ? 'Ocultar evidências' : 'Revisar evidências' }}</button>
          <div v-if="expanded === alert.id" class="mt-4 grid gap-4 border-t border-slate-200 pt-4 dark:border-white/10">
            <div
              class="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-300/15 dark:bg-blue-300/10">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 class="font-semibold text-[#0750AF] dark:text-blue-100">Registros da detecção</h3>
                  <p class="mt-1 text-xs text-slate-600 dark:text-slate-300">Revise o registro automático antes de
                    confirmar a comunicação.</p>
                </div>
              </div>
              <div class="mt-4 grid gap-4 lg:grid-cols-2">
                <div v-for="record in [alert.detection_records.initial, alert.detection_records.latest]"
                  :key="record.id"
                  class="overflow-hidden rounded-xl border border-white/70 bg-white dark:border-white/10 dark:bg-[#00182F]">
                  <img v-if="record.image_url" :src="record.image_url" alt="Frame registrado pela detecção automática"
                    class="h-40 w-full object-cover" />
                  <div class="p-3">
                    <div class="flex items-center justify-between gap-2">
                      <strong class="text-sm">{{ record.id === alert.detection_records.initial.id ? 'Detecção inicial' :
                        'Detecção mais recente' }}</strong>
                      <span
                        class="rounded-full bg-[#2768CA]/10 px-2 py-1 text-xs font-semibold text-[#0750AF] dark:text-blue-200">{{
                          percent(record.confidence) }}</span>
                    </div>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ formatDate(record.created_at) }} · ID
                      {{ record.id }}</p>
                    <dl class="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <dt class="text-slate-500 dark:text-slate-400">Normal</dt>
                        <dd class="font-semibold">{{ percent(record.probabilities.normal) }}</dd>
                      </div>
                      <div>
                        <dt class="text-slate-500 dark:text-slate-400">Intermediário</dt>
                        <dd class="font-semibold">{{ percent(record.probabilities.medium) }}</dd>
                      </div>
                      <div>
                        <dt class="text-slate-500 dark:text-slate-400">Alagado</dt>
                        <dd class="font-semibold">{{ percent(record.probabilities.flooded) }}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Normal</dt>
                <dd class="font-semibold">{{ percent(alert.evidence.probabilities.normal) }}</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Intermediário</dt>
                <dd class="font-semibold">{{ percent(alert.evidence.probabilities.medium) }}</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Alagado</dt>
                <dd class="font-semibold">{{ percent(alert.evidence.probabilities.flooded) }}</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Modelo</dt>
                <dd class="truncate font-semibold" :title="alert.evidence.model_version">{{ alert.evidence.model_version
                }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="alert.status === 'OPEN_INDICATION' || alert.status === 'CONFIRMED'"
            class="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
            <label class="block text-sm font-medium" :for="`reason-${alert.id}`">Justificativa <span
                class="font-normal text-slate-500">(opcional)</span>
              <textarea :id="`reason-${alert.id}`" v-model.trim="reasons[alert.id]" rows="2"
                class="mt-1 block w-full resize-y rounded-xl border border-slate-300 bg-transparent p-3 focus:border-[#2768CA] focus-visible:outline-2 focus-visible:outline-[#2768CA] dark:border-white/15"
                placeholder="Registre o motivo da decisão, se necessário." />
            </label>
            <label v-if="alert.status === 'CONFIRMED'" class="mt-3 flex items-start gap-2 text-sm"><input
                v-model="resolutionNotify[alert.id]" :true-value="true" :false-value="false" type="checkbox"
                class="mt-1 accent-[#2768CA]" /> Notificar usuários sobre o encerramento</label>
            <div class="mt-4 flex flex-wrap gap-2">
              <button v-if="alert.status === 'OPEN_INDICATION'" type="button"
                :disabled="store.actionId === alert.id || !alert.region"
                class="rounded-xl bg-[#2768CA] px-4 py-2.5 font-semibold text-white transition hover:bg-[#0750AF] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA]"
                @click="act(alert, 'confirm')">{{ store.actionId === alert.id ? 'Processando…' : 'Confirmar alagamento'
                }}</button>
              <button v-if="alert.status === 'OPEN_INDICATION'" type="button" :disabled="store.actionId === alert.id"
                class="rounded-xl border border-red-600 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-300/10"
                @click="act(alert, 'dismiss')">Descartar indício</button>
              <button v-if="alert.status === 'CONFIRMED'" type="button" :disabled="store.actionId === alert.id"
                class="rounded-xl bg-[#2768CA] px-4 py-2.5 font-semibold text-white transition hover:bg-[#0750AF] disabled:opacity-50"
                @click="act(alert, 'resolve')">Encerrar alerta</button>
            </div>
            <div v-if="!alert.region && alert.status === 'OPEN_INDICATION'"
              class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
              <strong>Localização territorial pendente.</strong> Revise a localização da câmera para associá-la a uma
              região canônica ativa.
              <RouterLink :to="`/admin/cameras/${alert.camera.id}/localizacao`"
                class="ml-1 font-semibold underline underline-offset-4">Corrigir localização</RouterLink>
            </div>
          </div>
        </div>
      </article>
    </div>

    <nav v-if="store.page.previous || store.page.next" aria-label="Paginação dos alertas"
      class="mt-6 flex items-center justify-center gap-3">
      <button :disabled="!store.page.previous"
        class="rounded-xl border border-slate-300 px-4 py-2 disabled:opacity-40 dark:border-white/15"
        @click="load((filters.page ?? 1) - 1)">Anterior</button>
      <span class="text-sm">Página {{ filters.page }}</span>
      <button :disabled="!store.page.next"
        class="rounded-xl border border-slate-300 px-4 py-2 disabled:opacity-40 dark:border-white/15"
        @click="load((filters.page ?? 1) + 1)">Próxima</button>
    </nav>
  </section>
</template>
