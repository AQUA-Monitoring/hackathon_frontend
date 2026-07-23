<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { CameraInspectionPanel, CameraOverviewCard } from '@/modules/cameras'
import { useCameraOverviewCatalog } from '@/modules/cameras'
import { useCameraOverviewPreferences } from '@/modules/cameras'
import { useCameraOverviewRoute } from '@/modules/cameras'
import { useCamerasMonitoring } from '@/modules/cameras'
import type { NeighborhoodDto } from '@/modules/cameras'

const route = useRoute()
const router = useRouter()
const isDesktop = useMediaQuery('(min-width: 1024px)')
const {
  cameras,
  loading,
  loadingMore,
  refreshing,
  lastCompletedAt,
  error,
  count,
  hasMore,
  load,
  loadMore,
  refresh,
  getById,
  getNeighborhoods,
} = useCamerasMonitoring({ autoLoad: false, autoRevalidate: true })

const lastUpdatedLabel = computed(() =>
  lastCompletedAt.value
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(lastCompletedAt.value))
    : 'Ainda não atualizado',
)

const territoryNeighborhoods = ref<NeighborhoodDto[]>([])
const {
  cardMinWidth,
  automaticGrid,
  previewsPaused,
  density,
  cameraGridStyle,
  setCardMinWidth,
  setPreviewsPaused,
} = useCameraOverviewPreferences(route, router)
const {
  filtersOpen,
  filters,
  selectedCamera,
  mobileInspectionOpen,
  currentFilters,
  applyFilters,
  clearFilters,
  selectCamera,
  closeInspection,
} = useCameraOverviewRoute(route, router, load, getById)
const { sortedCameras, regionOptions, neighborhoodOptions } =
  useCameraOverviewCatalog(cameras, territoryNeighborhoods)
let selectedDetailCompletedAt = 0
let selectedDetailGeneration = 0
let selectedDetailTimer: number | null = null

const activeFilterCount = computed(
  () =>
    [
      filters.region_id,
      filters.neighborhood_id,
      filters.administrative_status === 'INACTIVE' ? filters.administrative_status : '',
      filters.stream_status,
      filters.analysis_status,
    ].filter(Boolean).length,
)

const workspaceColumns = computed(() => {
  if (selectedCamera.value) return 'lg:grid-cols-[minmax(320px,1fr)_minmax(360px,0.8fr)]'
  return 'lg:grid-cols-1'
})

async function refreshOverview() {
  const selectedId = selectedCamera.value?.id
  await refresh()
  if (selectedId && selectedCamera.value?.id === selectedId) {
    await refreshSelectedDetail()
  }
}

async function refreshSelectedDetail() {
  const selectedId = selectedCamera.value?.id
  if (
    !selectedId ||
    document.visibilityState !== 'visible' ||
    !navigator.onLine
  ) {
    return
  }
  const generation = ++selectedDetailGeneration
  const camera = await getById(selectedId, true)
  if (
    generation === selectedDetailGeneration &&
    selectedCamera.value?.id === selectedId &&
    camera
  ) {
    selectedCamera.value = camera
    selectedDetailCompletedAt = Date.now()
  }
}

const revalidateSelectedDetail = () => {
  if (Date.now() - selectedDetailCompletedAt > 30_000) {
    void refreshSelectedDetail()
  }
}

watch(
  () => selectedCamera.value?.id,
  (id) => {
    selectedDetailGeneration += 1
    selectedDetailCompletedAt = id ? Date.now() : 0
  },
)

onMounted(async () => {
  try {
    territoryNeighborhoods.value = await getNeighborhoods()
  } catch {
    // A listagem continua oferecendo os territórios já carregados como fallback.
  }
})

onMounted(() => {
  selectedDetailTimer = window.setInterval(
    () => void refreshSelectedDetail(),
    60_000,
  )
  window.addEventListener('focus', revalidateSelectedDetail)
  window.addEventListener('online', revalidateSelectedDetail)
  document.addEventListener('visibilitychange', revalidateSelectedDetail)
})

onBeforeUnmount(() => {
  selectedDetailGeneration += 1
  if (selectedDetailTimer !== null) window.clearInterval(selectedDetailTimer)
  window.removeEventListener('focus', revalidateSelectedDetail)
  window.removeEventListener('online', revalidateSelectedDetail)
  document.removeEventListener('visibilitychange', revalidateSelectedDetail)
})
</script>

<template>
  <section class="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8 dark:text-white">
    <header class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p class="text-sm font-semibold tracking-[0.18em] text-[#2768CA] uppercase">
          Monitoramento por câmeras
        </p>
        <h1 class="mt-1 text-3xl font-semibold sm:text-4xl">Visão geral das câmeras</h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
          Priorize a inspeção por estado operacional e por indícios da análise automática. O
          resultado não confirma uma ocorrência.
        </p>
      </div>
      <div class="flex items-center gap-5">
        <img
          src="/gifs/camera.gif"
          alt=""
          aria-hidden="true"
          class="hidden h-20 w-20 object-contain xl:block"
        />
        <p v-if="!error" class="text-sm text-slate-500 dark:text-slate-400">
          <strong class="text-slate-800 dark:text-white">{{ count }}</strong>
          câmera{{ count === 1 ? '' : 's' }} encontrada{{ count === 1 ? '' : 's' }}
        </p>
      </div>
    </header>

    <div
      class="mt-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-[#001C3B]"
    >
      <form class="flex flex-col gap-3 sm:flex-row" role="search" @submit.prevent="applyFilters">
        <label class="relative flex-1">
          <span class="sr-only">Buscar câmera ou endereço</span>
          <span
            class="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
            >search</span
          >
          <input
            v-model="filters.search"
            type="search"
            class="min-h-12 w-full rounded-2xl border border-slate-300 bg-transparent pr-4 pl-11 outline-none focus:border-[#2768CA] focus:ring-3 focus:ring-[#2768CA]/15 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
            placeholder="Buscar câmera, rua ou bairro"
          />
        </label>
        <button
          type="submit"
          class="min-h-12 rounded-2xl bg-[#2768CA] px-5 font-semibold text-white hover:bg-[#1F57AD] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA]"
        >
          Buscar
        </button>
        <button
          type="button"
          class="relative min-h-12 rounded-2xl border border-slate-300 px-5 font-semibold hover:border-[#2768CA] focus-visible:outline-3 focus-visible:outline-[#2768CA] dark:border-slate-600"
          :aria-expanded="filtersOpen"
          @click="filtersOpen = !filtersOpen"
        >
          Filtros
          <span
            v-if="activeFilterCount"
            class="ml-2 rounded-full bg-[#2768CA] px-2 py-0.5 text-xs text-white"
            >{{ activeFilterCount }}</span
          >
        </button>
      </form>

      <div
        v-if="filtersOpen"
        class="mt-3 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-5 dark:border-slate-800"
      >
        <label class="grid gap-1 text-xs font-semibold"
          >Região
          <select
            v-model="filters.region_id"
            class="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
          >
            <option value="">Todas</option>
            <option v-for="item in regionOptions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label class="grid gap-1 text-xs font-semibold"
          >Bairro
          <select
            v-model="filters.neighborhood_id"
            class="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
          >
            <option value="">Todos</option>
            <option v-for="item in neighborhoodOptions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label class="grid gap-1 text-xs font-semibold"
          >Estado administrativo
          <select
            v-model="filters.administrative_status"
            class="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Ativa</option>
            <option value="INACTIVE">Inativa</option>
          </select>
        </label>
        <label class="grid gap-1 text-xs font-semibold"
          >Transmissão
          <select
            v-model="filters.stream_status"
            class="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
          >
            <option value="">Todas</option>
            <option value="UNKNOWN">Não verificada</option>
            <option value="CHECKING">Verificando</option>
            <option value="ONLINE">Disponível</option>
            <option value="UNAVAILABLE">Indisponível</option>
          </select>
        </label>
        <label class="grid gap-1 text-xs font-semibold"
          >Análise
          <select
            v-model="filters.analysis_status"
            class="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-600 dark:bg-[#00182F]"
          >
            <option value="">Todas</option>
            <option value="NOT_ANALYZED">Não analisada</option>
            <option value="RUNNING">Em andamento</option>
            <option value="AVAILABLE">Disponível</option>
            <option value="STALE">Desatualizada</option>
            <option value="NO_FRAME">Sem imagem</option>
            <option value="MODEL_UNAVAILABLE">Modelo indisponível</option>
            <option value="ERROR">Erro</option>
          </select>
        </label>
        <div class="flex gap-3 sm:col-span-2 xl:col-span-5 xl:justify-end">
          <button
            type="button"
            class="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 underline dark:text-slate-300"
            @click="clearFilters"
          >
            Limpar filtros
          </button>
          <button
            type="button"
            class="min-h-11 rounded-xl bg-[#2768CA] px-5 text-sm font-semibold text-white"
            @click="applyFilters"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4 hidden justify-end lg:flex">
      <div class="flex items-center mr-2 gap-2">
        <button type="button"
          class="min-h-11 rounded-xl border border-[#2768CA] px-4 text-sm font-semibold text-[#2768CA] disabled:opacity-60"
          :disabled="refreshing" @click="refreshOverview">
          {{ refreshing ? 'Atualizando...' : 'Atualizar dados' }}
        </button>

        <p class="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Última atualização: {{ lastUpdatedLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          class="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold dark:border-slate-600"
          :aria-pressed="previewsPaused"
          @click="setPreviewsPaused(!previewsPaused)"
        >
          {{ previewsPaused ? 'Retomar prévias' : 'Pausar prévias' }}
        </button>
        <div
          class="flex items-center gap-2 rounded-xl border border-slate-300 p-1 dark:border-slate-600"
          role="group"
          aria-label="Tamanho dos cartões"
        >
          <button
            type="button"
            class="grid size-9 place-items-center rounded-lg"
            aria-label="Reduzir cartões"
            :disabled="cardMinWidth <= 240"
            @click="setCardMinWidth(cardMinWidth - 40)"
          >
            −
          </button>
          <input
            :value="cardMinWidth"
            type="range"
            min="240"
            max="400"
            step="40"
            class="w-28 accent-[#2768CA]"
            aria-label="Largura mínima dos cartões"
            :aria-valuetext="`${cardMinWidth} pixels`"
            @input="setCardMinWidth(Number(($event.target as HTMLInputElement).value))"
          />
          <button
            type="button"
            class="grid size-9 place-items-center rounded-lg"
            aria-label="Aumentar cartões"
            :disabled="cardMinWidth >= 400"
            @click="setCardMinWidth(cardMinWidth + 40)"
          >
            +
          </button>
          <button
            type="button"
            class="min-h-9 rounded-lg px-3 text-sm font-semibold"
            :class="
              automaticGrid ? 'bg-[#2768CA] text-white' : 'text-slate-600 dark:text-slate-300'
            "
            :aria-pressed="automaticGrid"
            @click="setCardMinWidth(320, true)"
          >
            Automático
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="error"
      role="alert"
      class="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      <span>{{ error }}</span>
      <button
        type="button"
        class="min-h-11 font-semibold underline"
        @click="load(currentFilters())"
      >
        Tentar novamente
      </button>
    </div>

    <div class="mt-5 grid gap-5" :class="workspaceColumns">
      <div>
        <div
          v-if="loading"
          class="grid gap-3 lg:gap-4"
          :style="cameraGridStyle"
          aria-label="Carregando câmeras"
        >
          <div
            v-for="item in 5"
            :key="item"
            class="h-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800"
          ></div>
        </div>
        <div
          v-else-if="!sortedCameras.length && !error"
          class="rounded-3xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600"
        >
          <span class="material-symbols-outlined text-5xl text-slate-400" aria-hidden="true"
            >videocam_off</span
          >
          <h2 class="mt-3 text-lg font-semibold">Nenhuma câmera encontrada</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ajuste a busca ou limpe os filtros para ampliar a consulta.
          </p>
        </div>
        <div
          v-else
          class="grid gap-3 lg:gap-4"
          :style="cameraGridStyle"
          aria-label="Grade de câmeras"
          :data-density="density"
        >
          <CameraOverviewCard
            v-for="camera in sortedCameras"
            :key="camera.id"
            :camera="camera"
            :selected="selectedCamera?.id === camera.id"
            :density="density"
            :previews-paused="previewsPaused"
            @select="selectCamera"
          />
          <button
            v-if="hasMore"
            type="button"
            class="min-h-12 rounded-2xl border border-[#2768CA] px-4 font-semibold text-[#2768CA] disabled:opacity-60 sm:col-span-full"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Carregando...' : 'Carregar mais' }}
          </button>
        </div>
      </div>

      <template v-if="selectedCamera">
        <button
          v-if="mobileInspectionOpen"
          type="button"
          class="fixed inset-0 z-[60] bg-[#00182F]/55 lg:hidden"
          aria-label="Fechar inspeção"
          @click="closeInspection"
        ></button>
        <CameraInspectionPanel
          v-if="mobileInspectionOpen || isDesktop"
          :camera="selectedCamera"
          @close="closeInspection"
        />
      </template>
    </div>
  </section>
</template>
