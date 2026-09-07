<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { useTerritoryCatalog } from '@/modules/addressing'
import { notificationsApi } from './api'
import { useNotificationsStore } from './store'
import type { SavedPlace } from './types'
import { useWebPush } from './useWebPush'

const store = useNotificationsStore()
const webPush = useWebPush()
const territory = useTerritoryCatalog()
const savedPlaces = ref<SavedPlace[]>([])
const selectedRegion = ref('')
const selectedNeighborhood = ref('')
const busy = ref(false)
const place = reactive({ name: 'Casa', latitude: '', longitude: '', radius_km: 3 })
const followedIds = computed(() => new Set(store.regionSubscriptions.map((item) => item.region?.id).filter(Boolean)))
const followedNeighborhoodIds = computed(() => new Set(store.regionSubscriptions.map((item) => item.neighborhood?.id).filter(Boolean)))
const availableRegions = computed(() => territory.regions.value.filter((region) => !followedIds.value.has(region.id)))
const availableNeighborhoods = computed(() => territory.neighborhoods.value.filter((item) => !followedNeighborhoodIds.value.has(item.id)))
const stateCopy = computed(() => ({
  unsupported: ['Navegador incompatível', 'Este dispositivo não oferece suporte a Web Push.'],
  disabled_by_server: ['Indisponível no momento', 'O envio de push não está habilitado neste ambiente.'],
  prompt: ['Notificações desativadas', 'Ative para receber alertas dos territórios e locais salvos.'],
  denied: ['Permissão bloqueada', 'Libere notificações nas configurações do navegador para continuar.'],
  subscribing: ['Atualizando…', 'Aguarde enquanto configuramos este dispositivo.'],
  subscribed: ['Notificações ativas', 'Este dispositivo pode receber seus alertas territoriais.'],
  temporary_error: ['Falha temporária', webPush.error.value ?? 'Tente novamente em instantes.'],
}[webPush.state.value]))

async function load() {
  try {
    const [, places] = await Promise.all([store.loadRegionSubscriptions(), notificationsApi.listSavedPlaces(), territory.load(), webPush.refresh()])
    savedPlaces.value = places
  } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível carregar preferências.') }
}
async function follow() {
  if (!selectedRegion.value) return
  busy.value = true
  try { await store.followRegion(selectedRegion.value); selectedRegion.value = ''; toast.success('Região adicionada.') }
  finally { busy.value = false }
}
async function unfollow(id: string) {
  busy.value = true
  try { await store.unfollowRegion(id) } finally { busy.value = false }
}
async function followNeighborhood() {
  if (!selectedNeighborhood.value) return
  busy.value = true
  try { await notificationsApi.followNeighborhood(selectedNeighborhood.value); await store.loadRegionSubscriptions(); selectedNeighborhood.value = '' }
  finally { busy.value = false }
}
async function unfollowNeighborhood(id: string) {
  busy.value = true
  try { await notificationsApi.unfollowNeighborhood(id); await store.loadRegionSubscriptions() }
  finally { busy.value = false }
}
function useCurrentLocation() {
  navigator.geolocation.getCurrentPosition(({ coords }) => { place.latitude = String(coords.latitude); place.longitude = String(coords.longitude) }, () => toast.error('Não foi possível obter sua localização.'), { enableHighAccuracy: true, timeout: 8000 })
}
async function savePlace() {
  busy.value = true
  try {
    await notificationsApi.createSavedPlace({ name: place.name, latitude: Number(place.latitude), longitude: Number(place.longitude), radius_km: place.radius_km })
    savedPlaces.value = await notificationsApi.listSavedPlaces(); place.latitude = ''; place.longitude = ''
    toast.success('Local salvo para alertas próximos.')
  } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o local.') }
  finally { busy.value = false }
}
async function removePlace(id: string) {
  busy.value = true
  try { await notificationsApi.deleteSavedPlace(id); savedPlaces.value = savedPlaces.value.filter((item) => item.id !== id) }
  finally { busy.value = false }
}
onMounted(load)
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-5 lg:p-10" aria-labelledby="notifications-title">
    <h1 id="notifications-title" class="text-2xl font-semibold">Notificações</h1>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Controle o dispositivo, os territórios acompanhados e os locais próximos importantes para você.</p>
    <article class="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-white/15">
      <div class="flex flex-wrap items-center justify-between gap-4"><div><h2 class="font-semibold">{{ stateCopy[0] }}</h2><p class="mt-1 text-sm text-slate-600 dark:text-slate-300" role="status">{{ stateCopy[1] }}</p></div><button v-if="webPush.state.value === 'prompt' || webPush.state.value === 'temporary_error'" type="button" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white" @click="webPush.subscribe">Ativar neste dispositivo</button><button v-else-if="webPush.active.value" type="button" class="rounded-xl border border-[#2768CA] px-4 py-2 font-semibold text-[#2768CA]" @click="webPush.unsubscribe">Desativar neste dispositivo</button></div>
    </article>
    <article class="mt-5 rounded-2xl border border-slate-200 p-5 dark:border-white/15">
      <h2 class="font-semibold">Regiões acompanhadas</h2>
      <form class="mt-3 flex flex-col gap-2 sm:flex-row" @submit.prevent="follow"><label class="sr-only" for="region-subscription">Selecione uma região</label><select id="region-subscription" v-model="selectedRegion" class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-transparent p-2" required><option value="" disabled>Selecione uma região</option><option v-for="region in availableRegions" :key="region.id" :value="region.id">{{ region.name }}</option></select><button :disabled="busy" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white disabled:opacity-50">Acompanhar</button></form>
      <p v-if="!store.regionSubscriptions.some((item) => item.region)" class="mt-5 text-sm text-slate-600 dark:text-slate-300">Você ainda não acompanha nenhuma região.</p>
      <ul v-else class="mt-4 grid gap-2"><li v-for="item in store.regionSubscriptions.filter((entry) => entry.region)" :key="item.id" class="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/10"><span><strong class="block">{{ item.region?.name }}</strong><small>{{ item.region?.city.name }}</small></span><button v-if="item.region" type="button" :disabled="busy" class="font-semibold text-red-700 underline dark:text-red-300" @click="unfollow(item.region.id)">Remover</button></li></ul>
      <h3 class="mt-6 font-semibold">Bairros acompanhados</h3>
      <form class="mt-3 flex flex-col gap-2 sm:flex-row" @submit.prevent="followNeighborhood"><label class="sr-only" for="neighborhood-subscription">Selecione um bairro</label><select id="neighborhood-subscription" v-model="selectedNeighborhood" class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-transparent p-2" required><option value="" disabled>Selecione um bairro</option><option v-for="item in availableNeighborhoods" :key="item.id" :value="item.id">{{ item.name }}</option></select><button :disabled="busy" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white disabled:opacity-50">Acompanhar</button></form>
      <ul class="mt-4 grid gap-2"><li v-for="item in store.regionSubscriptions.filter((entry) => entry.neighborhood)" :key="item.id" class="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/10"><span><strong class="block">{{ item.neighborhood?.name }}</strong><small>{{ item.neighborhood?.city }}</small></span><button v-if="item.neighborhood" type="button" :disabled="busy" class="font-semibold text-red-700 underline dark:text-red-300" @click="unfollowNeighborhood(item.neighborhood.id)">Remover</button></li></ul>
    </article>
    <article class="mt-5 rounded-2xl border border-slate-200 p-5 dark:border-white/15">
      <h2 class="font-semibold">Locais salvos</h2><p class="mt-1 text-sm text-slate-600 dark:text-slate-300">As coordenadas são privadas e usadas somente para calcular alertas no raio escolhido. O Aqua não acompanha seus deslocamentos.</p>
      <form class="mt-4 grid gap-3 sm:grid-cols-2" @submit.prevent="savePlace"><label class="text-sm font-medium">Nome<input v-model="place.name" maxlength="80" required class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-2" /></label><label class="text-sm font-medium">Raio: {{ place.radius_km }} km<input v-model.number="place.radius_km" type="range" min="1" max="10" step="1" class="mt-3 w-full" /></label><label class="text-sm font-medium">Latitude<input v-model="place.latitude" type="number" min="-90" max="90" step="any" required class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-2" /></label><label class="text-sm font-medium">Longitude<input v-model="place.longitude" type="number" min="-180" max="180" step="any" required class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-2" /></label><div class="flex flex-wrap gap-2 sm:col-span-2"><button type="button" class="rounded-xl border border-[#2768CA] px-4 py-2 font-semibold text-[#2768CA]" @click="useCurrentLocation">Usar localização atual</button><button :disabled="busy" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white disabled:opacity-50">Salvar local</button></div></form>
      <ul class="mt-4 grid gap-2"><li v-for="item in savedPlaces" :key="item.id" class="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/10"><span><strong class="block">{{ item.name }} · {{ item.radius_km }} km</strong><small>{{ [item.territory.neighborhood, item.territory.region, item.territory.city].filter(Boolean).join(' · ') }}</small></span><button type="button" :disabled="busy" class="font-semibold text-red-700 underline dark:text-red-300" @click="removePlace(item.id)">Excluir</button></li></ul>
    </article>
  </section>
</template>
