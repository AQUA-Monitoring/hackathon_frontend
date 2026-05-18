<script setup lang="ts">
import { CamerasGrid } from '@/components'
import { useCamerasMonitoring } from '@/composables/useCamerasMonitoring'

const { camerasWithPrediction } = useCamerasMonitoring()
</script>

<template>
  <section>
    <CamerasGrid :cameras="camerasWithPrediction" />
  </section>
</template>

<!-- <script setup lang="ts">
import { reactive, onMounted, computed } from 'vue'
import { useLoadingStore } from '@/@core/plugins/registered/pinia/loading'
import type { CameraWithPrediction } from '../../interfaces/predictions'
import { useFloodCameraMonitoringController } from '../../controller/FloodCameraMonitoringController'
import { StreamingStreetsBanner, HlsStreamPlayer, EmbedStreamPlayer } from '../components'

type ViewMode = 'embed' | 'hls'

const ctrl = useFloodCameraMonitoringController()
const cams = computed(() => ctrl.camerasWithPrediction)
const loading = useLoadingStore()

// Ordena: Online primeiro; depois por % de alagamento (desc); offline/inativas por último
const orderedCams = computed(() => {
  return [...cams.value].sort((a, b) => {
    const aOnline = a.status === 'Online'
    const bOnline = b.status === 'Online'
    if (aOnline !== bOnline) return aOnline ? -1 : 1
    const aPct = displayFloodPercent(a as any)
    const bPct = displayFloodPercent(b as any)
    if (aPct !== bPct) return bPct - aPct
    // secundário: ordem alfabética pelo nome (estável)
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
})

const modes = reactive<Record<string, ViewMode>>({})

onMounted(async () => {
  loading.start()
  await ctrl.load()
  cams.value.forEach((c: any) => {
    // Set HLS as default mode for all cameras
    modes[c.id] = 'hls'
  })
  loading.stop()
})

function displayFloodPercent(cam: CameraWithPrediction): number {
  if (cam.prediction && typeof cam.prediction.probabilities?.flooded === 'number') {
    const v = cam.prediction.probabilities.flooded
    const clamped = Math.min(100, Math.max(0, v))
    return Number(clamped.toFixed(2))
  }
  return cam.flood_percentage
}

// Formata a porcentagem usando vírgula como separador decimal (pt-BR)
function formatFloodPercent(cam: CameraWithPrediction): string {
  try {
    return displayFloodPercent(cam).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } catch (e) {
    // fallback simples caso algo inesperado ocorra
    return String(displayFloodPercent(cam)).replace('.', ',')
  }
}
</script>

<template>
  <div class="grid justify-center px-5 lg:justify-normal">
    <StreamingStreetsBanner />

    <p v-if="ctrl.loading" class="mt-10 text-center text-sm opacity-70">Carregando câmeras…</p>
    <p v-else-if="ctrl.error" class="mt-10 text-center text-sm text-red-600">
      {{ ctrl.error }}
    </p>

    <div v-else class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      <div
        v-for="cam in orderedCams"
        :key="cam.id"
        class="grid overflow-hidden rounded-xl bg-white p-5 shadow-sm dark:bg-[#000d19]"
      >
        <div class="overflow-hidden rounded-2xl bg-transparent lg:h-[10vw]">
          <EmbedStreamPlayer
            v-if="modes[cam.id] === 'embed' && cam.embed_url"
            :src="cam.embed_url"
            :title="cam.name"
            class="h-full w-full"
          />
          <HlsStreamPlayer
            v-else
            :src="cam.hls_url"
            :muted="true"
            :controls="true"
            :lock-to-live="true"
            :live-delay="18"
            class="h-full w-full"
          />
        </div>

        <div class="flex flex-1 flex-col gap-2 px-4">
          <div class="flex items-start justify-between gap-5 py-3 text-sm lg:text-base">
            <p>{{ cam.name }}</p>
            <div class="flex shrink-0 gap-1">
              <button
                type="button"
                class="rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-slate-300 dark:ring-slate-600"
                :class="
                  modes[cam.id] === 'embed'
                    ? 'bg-emerald-600 text-white ring-emerald-600'
                    : 'bg-transparent text-slate-600 dark:text-slate-300'
                "
                :disabled="!cam.embed_url"
                @click="modes[cam.id] = 'embed'"
                title="Realtime (Embed)"
              >
                Realtime
              </button>
              <button
                type="button"
                class="rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-slate-300 dark:ring-slate-600"
                :class="
                  modes[cam.id] === 'hls'
                    ? 'bg-blue-500 text-white ring-blue-600'
                    : 'bg-transparent text-slate-600 dark:text-slate-300'
                "
                @click="modes[cam.id] = 'hls'"
                title="HLS"
              >
                HLS
              </button>
            </div>
          </div>

          <div class="flex items-center justify-center gap-1.5">
            <p class="flex items-center gap-2 text-right text-xs lg:text-sm">
              Porcentagem de alagamento:
              <span
                class="text-2xl font-semibold"
                :class="
                  displayFloodPercent(cam) <= 40
                    ? 'text-[#27CA2C]'
                    : displayFloodPercent(cam) <= 70
                      ? 'text-[#F87400]'
                      : 'text-[#FF0A0A]'
                "
                >{{ formatFloodPercent(cam) }}%</span
              >
            </p>
          </div>

          <p>
            Status:
            <span
              :class="
                cam.status.toLowerCase() === 'online'
                  ? 'text-[#27CA2C]'
                  : cam.status.toLowerCase() === 'offline'
                    ? 'text-[#CA2727]'
                    : 'text-[#999999]'
              "
            >
              {{ cam.status.charAt(0).toUpperCase() + cam.status.slice(1).toLowerCase() }}
            </span>
          </p>

          <div class="mt-auto flex justify-center">
            <RouterLink
              :to="{ path: `/cameras/${cam.id}` }"
              class="rounded-xl bg-blue-500 px-10 py-2 font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600"
            >
              Ver mais
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> -->
