<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { AddressingApi } from '@/modules/addressing'
import { useNotificationsStore } from './store'
import { useWebPush } from './useWebPush'

const store = useNotificationsStore()
const webPush = useWebPush()
const addressing = new AddressingApi()
const regions = ref<{ id: string; name: string; city: string | null }[]>([])
const selectedRegion = ref('')
const busyRegion = ref(false)
const followedIds = computed(() => new Set(store.regionSubscriptions.map((item) => item.region.id)))
const availableRegions = computed(() => regions.value.filter((region) => !followedIds.value.has(region.id)))

const stateCopy = computed(() => ({
  unsupported: ['Navegador incompatível', 'Este dispositivo não oferece suporte a Web Push.'],
  disabled_by_server: ['Indisponível no momento', 'O envio de push não está habilitado neste ambiente.'],
  prompt: ['Notificações desativadas', 'Ative quando quiser receber alertas das regiões acompanhadas.'],
  denied: ['Permissão bloqueada', 'Libere notificações nas configurações do navegador para continuar.'],
  subscribing: ['Atualizando…', 'Aguarde enquanto configuramos este dispositivo.'],
  subscribed: ['Notificações ativas', 'Este dispositivo pode receber alertas das regiões acompanhadas.'],
  temporary_error: ['Falha temporária', webPush.error.value ?? 'Tente novamente em instantes.'],
}[webPush.state.value]))

async function load() {
  try {
    const [, territories] = await Promise.all([
      store.loadRegionSubscriptions(),
      addressing.getRegionTerritories(),
      webPush.refresh(),
    ])
    regions.value = territories.features.map(({ properties }) => ({
      id: properties.id,
      name: properties.name,
      city: properties.city,
    }))
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Não foi possível carregar preferências.')
  }
}

async function follow() {
  if (!selectedRegion.value) return
  busyRegion.value = true
  try {
    await store.followRegion(selectedRegion.value)
    selectedRegion.value = ''
    toast.success('Região adicionada às notificações.')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Não foi possível seguir a região.')
  } finally {
    busyRegion.value = false
  }
}

async function unfollow(id: string) {
  busyRegion.value = true
  try {
    await store.unfollowRegion(id)
    toast.success('Região removida das notificações.')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Não foi possível remover a região.')
  } finally {
    busyRegion.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-5 lg:p-10" aria-labelledby="notifications-title">
    <h1 id="notifications-title" class="text-2xl font-semibold">Notificações</h1>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Escolha as regiões que você acompanha e autorize este dispositivo somente quando desejar.</p>

    <article class="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-white/15">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div><h2 class="font-semibold">{{ stateCopy[0] }}</h2><p class="mt-1 text-sm text-slate-600 dark:text-slate-300" role="status">{{ stateCopy[1] }}</p></div>
        <button v-if="webPush.state.value === 'prompt' || webPush.state.value === 'temporary_error'" type="button" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white" @click="webPush.subscribe">Ativar neste dispositivo</button>
        <button v-else-if="webPush.active.value" type="button" class="rounded-xl border border-[#2768CA] px-4 py-2 font-semibold text-[#2768CA]" @click="webPush.unsubscribe">Desativar neste dispositivo</button>
      </div>
    </article>

    <article class="mt-5 rounded-2xl border border-slate-200 p-5 dark:border-white/15">
      <h2 class="font-semibold">Regiões acompanhadas</h2>
      <form class="mt-3 flex flex-col gap-2 sm:flex-row" @submit.prevent="follow">
        <label class="sr-only" for="region-subscription">Selecione uma região</label>
        <select id="region-subscription" v-model="selectedRegion" class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-transparent p-2" required><option value="" disabled>Selecione uma região</option><option v-for="region in availableRegions" :key="region.id" :value="region.id">{{ region.name }}{{ region.city ? ` — ${region.city}` : '' }}</option></select>
        <button :disabled="busyRegion" class="rounded-xl bg-[#2768CA] px-4 py-2 font-semibold text-white disabled:opacity-50">Acompanhar</button>
      </form>
      <p v-if="!store.regionSubscriptions.length" class="mt-5 text-sm text-slate-600 dark:text-slate-300">Você ainda não acompanha nenhuma região.</p>
      <ul v-else class="mt-4 grid gap-2">
        <li v-for="item in store.regionSubscriptions" :key="item.region.id" class="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/10"><span><strong class="block">{{ item.region.name }}</strong><small>{{ item.region.city.name }}</small></span><button type="button" :disabled="busyRegion" class="font-semibold text-red-700 underline dark:text-red-300" :aria-label="`Parar de acompanhar ${item.region.name}`" @click="unfollow(item.region.id)">Remover</button></li>
      </ul>
    </article>
  </section>
</template>
