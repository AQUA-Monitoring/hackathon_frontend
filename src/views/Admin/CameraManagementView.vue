<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { FloodCameraMonitoringApi } from '@/modules/cameras'
import type { CameraApiItem, CameraStatus } from '@/modules/cameras'
import { parseApiError } from '@/shared'

const api = new FloodCameraMonitoringApi()
const cameras = ref<CameraApiItem[]>([])
const selected = ref<CameraApiItem | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const saving = ref(false)
const page = ref(1)
const total = ref(0)
const pageError = ref<string | null>(null)

const form = reactive({
  description: '',
  videoHls: '',
  videoEmbed: '',
  status: 'ACTIVE' as CameraStatus,
})

const hasMore = computed(() => cameras.value.length < total.value)
const selectedAddressLabel = computed(() => {
  const address = selected.value?.address
  if (!address) return 'Endereço não informado'
  return [address.street, address.number, address.city, address.state].filter(Boolean).join(', ')
})

function resetForm(camera: CameraApiItem) {
  form.description = camera.description
  form.videoHls = camera.video_hls ?? ''
  form.videoEmbed = camera.video_embed ?? ''
  form.status = camera.status as CameraStatus
}

async function selectCamera(id: string) {
  pageError.value = null
  try {
    const camera = await api.getCamera(id)
    selected.value = camera
    resetForm(camera)
  } catch (error) {
    pageError.value = parseApiError(
      error,
      'Não foi possível carregar os detalhes da câmera.',
    ).message
  }
}

async function loadCameras(nextPage = 1) {
  const response = await api.getCameras({ page: nextPage })
  cameras.value = nextPage === 1 ? response.results : [...cameras.value, ...response.results]
  total.value = response.count
  page.value = nextPage
}

async function refreshList() {
  loading.value = true
  pageError.value = null
  try {
    await loadCameras()
  } catch (error) {
    pageError.value = parseApiError(error, 'Não foi possível carregar as câmeras.').message
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  loadingMore.value = true
  try {
    await loadCameras(page.value + 1)
  } catch (error) {
    pageError.value = parseApiError(error, 'Não foi possível carregar mais câmeras.').message
  } finally {
    loadingMore.value = false
  }
}

async function save() {
  if (!selected.value) return
  saving.value = true
  pageError.value = null
  try {
    const updated = await api.updateCamera(selected.value.id, {
      description: form.description.trim(),
      video_hls: form.videoHls.trim() || undefined,
      video_embed: form.videoEmbed.trim() || null,
      status: form.status,
    })
    selected.value = updated
    const index = cameras.value.findIndex((camera) => camera.id === updated.id)
    if (index >= 0) cameras.value.splice(index, 1, updated)
    resetForm(updated)
    toast.success('Câmera atualizada.')
  } catch (error) {
    pageError.value = parseApiError(error, 'Não foi possível atualizar a câmera.').message
  } finally {
    saving.value = false
  }
}

onMounted(refreshList)
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-5 py-6 lg:px-0">
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-[#2768CA]">Operação</p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900 dark:text-white">Gerenciar câmeras</h1>
        <p class="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
          Atualize a transmissão, a disponibilidade pública e a localização de cada câmera.
        </p>
      </div>
      <RouterLink
        to="/admin/cameras/cadastro"
        class="rounded-xl bg-[#0453AF] px-4 py-2 font-semibold text-white"
      >
        Cadastrar câmera
      </RouterLink>
    </header>

    <p
      v-if="pageError"
      class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      role="alert"
    >
      {{ pageError }}
    </p>

    <div class="grid gap-6 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
      <aside
        class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div class="flex items-center justify-between px-2 pb-3">
          <h2 class="font-semibold">Câmeras cadastradas</h2>
          <button
            type="button"
            class="text-sm font-semibold text-[#0453AF]"
            :disabled="loading"
            @click="refreshList"
          >
            Atualizar
          </button>
        </div>
        <p v-if="loading" class="p-3 text-sm text-slate-500" aria-live="polite">
          Carregando câmeras…
        </p>
        <p v-else-if="!cameras.length" class="p-3 text-sm text-slate-500">
          Nenhuma câmera cadastrada.
        </p>
        <div v-else class="grid gap-2">
          <button
            v-for="camera in cameras"
            :key="camera.id"
            type="button"
            class="rounded-xl border p-3 text-left transition focus:outline-2 focus:outline-offset-2 focus:outline-[#0453AF]"
            :class="
              selected?.id === camera.id
                ? 'border-[#0453AF] bg-blue-50 dark:bg-blue-950/30'
                : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'
            "
            :aria-pressed="selected?.id === camera.id"
            @click="selectCamera(camera.id)"
          >
            <span class="block truncate font-semibold">{{
              camera.description || 'Câmera sem descrição'
            }}</span>
            <span class="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
              <span class="truncate">{{
                camera.address?.city || 'Localização não informada'
              }}</span>
              <span :class="camera.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'">
                {{
                  camera.status === 'ACTIVE'
                    ? 'Ativa'
                    : camera.status === 'OFFLINE'
                      ? 'Offline'
                      : 'Inativa'
                }}
              </span>
            </span>
          </button>
        </div>
        <button
          v-if="hasMore"
          type="button"
          class="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? 'Carregando…' : 'Mostrar mais câmeras' }}
        </button>
      </aside>

      <div
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div
          v-if="!selected"
          class="flex min-h-72 items-center justify-center text-center text-slate-500"
        >
          Selecione uma câmera para visualizar e editar seus dados.
        </div>
        <form v-else class="grid gap-6" @submit.prevent="save">
          <div
            class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700"
          >
            <div>
              <h2 class="text-xl font-bold">Editar câmera</h2>
              <p class="mt-1 text-sm text-slate-500">{{ selectedAddressLabel }}</p>
            </div>
            <label class="grid gap-1 text-sm font-semibold">
              Estado operacional
              <select
                v-model="form.status"
                class="rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-600"
              >
                <option value="ACTIVE">Ativa — transmissão e análise</option>
                <option value="OFFLINE">Offline — somente transmissão</option>
                <option value="INACTIVE">Inativa — sem transmissão e análise</option>
              </select>
            </label>
          </div>

          <fieldset class="grid gap-4">
            <legend class="font-semibold">Identificação e transmissão</legend>
            <label class="grid gap-1 text-sm font-medium"
              >Descrição
              <input
                v-model="form.description"
                required
                maxlength="255"
                class="rounded-lg border border-slate-300 bg-transparent px-3 py-2"
              />
            </label>
            <label class="grid gap-1 text-sm font-medium"
              >Link HLS
              <input
                v-model="form.videoHls"
                :required="form.status !== 'INACTIVE'"
                type="url"
                class="rounded-lg border border-slate-300 bg-transparent px-3 py-2"
                placeholder="https://…/playlist.m3u8"
              />
            </label>
            <label class="grid gap-1 text-sm font-medium"
              >Link de incorporação (opcional)
              <input
                v-model="form.videoEmbed"
                type="url"
                class="rounded-lg border border-slate-300 bg-transparent px-3 py-2"
                placeholder="https://…"
              />
            </label>
          </fieldset>

          <section
            class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <div>
              <h3 class="font-semibold">Localização da câmera</h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {{ selectedAddressLabel }}
              </p>
            </div>
            <RouterLink
              :to="`/admin/cameras/${selected.id}/localizacao`"
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#0453AF] px-4 py-2 font-semibold text-[#0453AF]"
            >
              <span class="material-symbols-outlined" aria-hidden="true">edit_location_alt</span>
              Alterar no mapa
            </RouterLink>
          </section>

          <div class="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
            <button
              type="button"
              class="rounded-xl px-4 py-2 font-semibold text-slate-700 dark:text-slate-200"
              :disabled="saving"
              @click="resetForm(selected)"
            >
              Descartar
            </button>
            <button
              type="submit"
              class="rounded-xl bg-[#0453AF] px-5 py-2 font-semibold text-white disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'Salvando…' : 'Salvar alterações' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
