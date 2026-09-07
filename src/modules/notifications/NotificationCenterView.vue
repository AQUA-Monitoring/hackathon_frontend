<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { useTerritoryCatalog } from '@/modules/addressing'
import OperationalAlertsView from './OperationalAlertsView.vue'
import { notificationsApi } from './api'
import type { NotificationEvent } from './types'

type Tab = 'review' | 'published' | 'new' | 'deliveries'
const tab = ref<Tab>('review')
const events = ref<NotificationEvent[]>([])
const busy = ref(false)
const preview = ref<{ users: number; devices: number } | null>(null)
const territory = useTerritoryCatalog()
const form = reactive({ title: '', message: '', severity: 'ATTENTION', region_ids: [] as string[], neighborhood_ids: [] as string[] })
const visibleEvents = computed(() => events.value.filter((item) => tab.value === 'published' ? item.status === 'PUBLISHED' : true))

async function loadEvents() { events.value = await notificationsApi.listEvents() }
async function prepareManual() {
  busy.value = true; preview.value = null
  try {
    const event = await notificationsApi.createManualEvent(form)
    preview.value = await notificationsApi.previewEvent(event.id)
    if (!window.confirm(`Este comunicado alcançará ${preview.value.users} usuário(s) em ${preview.value.devices} dispositivo(s). Publicar agora?`)) {
      await notificationsApi.cancelEvent(event.id); return
    }
    await notificationsApi.publishEvent(event.id)
    toast.success('Comunicado publicado e entregas agendadas.')
    Object.assign(form, { title: '', message: '', severity: 'ATTENTION', region_ids: [], neighborhood_ids: [] })
    await loadEvents(); tab.value = 'published'
  } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível publicar o comunicado.') }
  finally { busy.value = false }
}
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
onMounted(() => Promise.all([territory.load(), loadEvents()]))
</script>

<template>
  <section class="w-full min-w-0 px-4 py-5 sm:px-6 lg:px-0" aria-labelledby="notification-center-title">
    <header class="mb-5 rounded-3xl bg-gradient-to-br from-[#00182F] to-[#0750AF] p-6 text-white"><p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Administração</p><h1 id="notification-center-title" class="mt-2 text-3xl font-semibold">Central de notificações</h1><p class="mt-2 text-blue-100">Revise detecções, publique comunicados e acompanhe as entregas em um só lugar.</p></header>
    <nav class="mb-5 flex flex-wrap gap-2" aria-label="Seções da central"><button v-for="item in ([['review','Para revisar'],['published','Publicados'],['new','Novo comunicado'],['deliveries','Entregas']] as const)" :key="item[0]" type="button" :class="['rounded-xl px-4 py-2 font-semibold', tab === item[0] ? 'bg-[#2768CA] text-white' : 'border border-slate-300']" @click="tab = item[0]">{{ item[1] }}</button></nav>
    <OperationalAlertsView v-if="tab === 'review'" />
    <form v-else-if="tab === 'new'" class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#001C3B]" @submit.prevent="prepareManual">
      <label class="font-medium">Título<input v-model="form.title" maxlength="160" required class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3" /></label>
      <label class="font-medium">Mensagem<textarea v-model="form.message" maxlength="1000" required rows="5" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3" /></label>
      <label class="font-medium">Severidade<select v-model="form.severity" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3"><option value="INFO">Informativo</option><option value="ATTENTION">Atenção</option><option value="CRITICAL">Crítico</option></select></label>
      <div class="grid gap-4 md:grid-cols-2"><label class="font-medium">Regiões<select v-model="form.region_ids" multiple class="mt-1 h-40 w-full rounded-xl border border-slate-300 bg-transparent p-2"><option v-for="item in territory.regions.value" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label class="font-medium">Bairros<select v-model="form.neighborhood_ids" multiple class="mt-1 h-40 w-full rounded-xl border border-slate-300 bg-transparent p-2"><option v-for="item in territory.neighborhoods.value" :key="item.id" :value="item.id">{{ item.name }}</option></select></label></div>
      <p v-if="preview" role="status">Prévia: {{ preview.users }} usuários e {{ preview.devices }} dispositivos.</p><button :disabled="busy || (!form.region_ids.length && !form.neighborhood_ids.length)" class="w-fit rounded-xl bg-[#2768CA] px-5 py-3 font-semibold text-white disabled:opacity-50">Revisar alcance e publicar</button>
    </form>
    <div v-else class="grid gap-3">
      <p v-if="!visibleEvents.length" class="rounded-2xl border border-dashed p-8 text-center text-slate-500">Nenhuma notificação encontrada.</p>
      <article v-for="event in visibleEvents" :key="event.id" class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#001C3B]"><div class="flex flex-wrap items-start justify-between gap-3"><div><span class="text-xs font-semibold text-[#2768CA]">{{ event.origin }} · {{ event.severity }}</span><h2 class="mt-1 text-lg font-semibold">{{ event.title }}</h2><p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ event.message }}</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-white/10">{{ event.status }}</span></div><div class="mt-4 flex flex-wrap gap-4 text-sm"><span>{{ formatDate(event.published_at || event.created_at) }}</span><span>{{ event.audience_count }} destinatários</span><span>Enviadas: {{ event.delivery_summary.sent }}</span><span>Pendentes: {{ event.delivery_summary.pending }}</span><span>Falhas: {{ event.delivery_summary.failed }}</span><span>Expiradas: {{ event.delivery_summary.expired }}</span></div></article>
    </div>
  </section>
</template>
