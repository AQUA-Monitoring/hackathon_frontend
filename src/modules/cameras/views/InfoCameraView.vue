<script setup lang="ts">
import { reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLoadingStore } from '@/stores/loading'
import { HlsPlayer, EmbedPlayer, ModesInputs } from '../components'
import { useCamerasMonitoring } from '../composables/useCamerasMonitoring'
import { displayFloodPercent } from '@/utils/flood'
import type { ViewMode } from '../types/camera'

const props = defineProps<{ id: string }>()
const router = useRouter()
const loading = useLoadingStore()
const { camerasWithPrediction } = useCamerasMonitoring()

const cameras = computed(() => camerasWithPrediction.value)
const camera = computed(() => cameras.value.find((c) => c.id === props.id))

const currentIndex = computed(() => cameras.value.findIndex((c) => c.id === props.id))
const canPrev = computed(() => currentIndex.value > 0)
const canNext = computed(
  () => currentIndex.value >= 0 && currentIndex.value < cameras.value.length - 1,
)
const modes = reactive<Record<string, ViewMode>>({})

onMounted(async () => {
  loading.start()
  const c = cameras.value.find((x) => x.id === props.id)
  if (c && !modes[c.id]) modes[c.id] = 'hls' // Set HLS as default for all cameras
  loading.stop()
})

watch(camera, (c) => {
  if (c && !modes[c.id]) modes[c.id] = 'hls' // Set HLS as default for all cameras
})

function goPrev() {
  if (!canPrev.value) return
  const target = cameras.value[currentIndex.value - 1]
  if (target) router.push(`/cameras/${target.id}`)
}

function goNext() {
  if (!canNext.value) return
  const target = cameras.value[currentIndex.value + 1]
  if (target) router.push(`/cameras/${target.id}`)
}
</script>

<template>
  <div v-if="camera" class="grid justify-center">
    <h1 class="mb-7 text-center font-semibold lg:text-2xl">{{ camera.name }}</h1>

    <div class="group relative mx-auto h-[39vw] w-[80vw] overflow-hidden rounded-2xl">
      <EmbedPlayer
        v-if="modes[camera.id] === 'embed' && camera.embed_url"
        :src="camera.embed_url"
        :title="camera.name"
        class="h-full w-full"
      />
      <HlsPlayer
        v-else
        :src="camera.hls_url"
        :muted="true"
        :controls="true"
        :lock-to-live="true"
        :live-delay="18"
        class="h-full w-full"
      />
    </div>

    <div class="my-5 flex justify-end">
      <ModesInputs :cam="camera" v-model="modes[camera.id]" />
    </div>

    <div class="flex items-center justify-between text-sm lg:hidden">
      <p class="grid text-center font-semibold">
        Câmera <span>{{ currentIndex + 1 }} de {{ cameras.length }}</span>
      </p>

      <p class="grid text-center font-semibold">
        Probabilidade de <span>alagamento:</span>
        <span
          class="text-xl"
          :class="
            displayFloodPercent(camera) <= 40
              ? 'text-[#27CA2C]'
              : displayFloodPercent(camera) <= 70
                ? 'text-[#F87400]'
                : 'text-[#FF0A0A]'
          "
          >{{ displayFloodPercent(camera) }}%</span
        >
      </p>
    </div>

    <div
      class="mt-20 flex items-center justify-between rounded-2xl bg-[#7AA6C8]/30 py-2 text-sm font-semibold shadow-xl backdrop-blur-xs lg:hidden"
    >
      <button
        @click="goPrev"
        :disabled="!canPrev"
        class="text-[#1359B9] cursor-pointer material-symbols-outlined px-8 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        chevron_left
      </button>

      <RouterLink to="/cameras" class="border-r border-l border-[#1359B9] cursor-pointer px-10"
        >Ver mais</RouterLink
      >

      <button
        @click="goNext"
        :disabled="!canNext"
        class="text-[#1359B9] cursor-pointer material-symbols-outlined px-8 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        chevron_right
      </button>
    </div>

    <div class="mt-5 hidden items-center justify-between lg:flex">
      <p class="grid text-center text-2xl font-semibold">
        Câmera <span>{{ currentIndex + 1 }} de {{ cameras.length }}</span>
      </p>

      <div
        class="flex items-center justify-between rounded-2xl bg-[#7AA6C8]/30 py-2 font-semibold shadow-xl backdrop-blur-xs"
      >
        <button
          @click="goPrev"
          :disabled="!canPrev"
          class="text-[#1359B9] cursor-pointer material-symbols-outlined px-8 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          chevron_left
        </button>

        <RouterLink
          to="/cameras"
          class="border-r border-l border-[#1359B9] cursor-pointer px-30 text-lg"
          >Ver mais</RouterLink
        >

        <button
          @click="goNext"
          :disabled="!canNext"
          class="text-[#1359B9] cursor-pointer material-symbols-outlined px-8 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          chevron_right
        </button>
      </div>

      <p class="grid text-center font-semibold">
        Probabilidade de <span>alagamento:</span>
        <span
          class="text-4xl"
          :class="
            displayFloodPercent(camera) <= 40
              ? 'text-[#27CA2C]'
              : displayFloodPercent(camera) <= 70
                ? 'text-[#F87400]'
                : 'text-[#FF0A0A]'
          "
          >{{ displayFloodPercent(camera) }}%</span
        >
      </p>
    </div>
  </div>

  <div v-else class="grid items-center justify-center text-center mx-10">
    <h2 class="mb-3 text-2xl font-bold">Câmera não encontrada</h2>
    <p class="mb-6 max-w-md text-slate-600 dark:text-slate-400">
      A câmera solicitada não foi encontrada ou pode ter sido removida do sistema.
    </p>

    <RouterLink
      to="/cameras"
      class="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-blue-600"
    >
      Voltar para todas as câmeras
    </RouterLink>
  </div>
</template>
