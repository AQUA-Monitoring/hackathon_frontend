<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { EmbedPlayer, HlsPlayer, ModesInputs } from '../components'
import { BaseButton } from '@/components'
import { displayFloodPercent, formatFloodPercent } from '@/utils/flood'
import type { ViewMode, ICamera } from '../types/camera'

defineProps<{
  cam: ICamera
}>()

const router = useRouter()
const modes = reactive<Record<string, ViewMode>>({})

function goToCamera(id: string) {
  router.push(`/cameras/${id}`)
}
</script>

<template>
  <div class="rounded-2xl bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.40)] dark:bg-[#001C3B]">
    <div class="overflow-hidden rounded-3xl lg:h-[10vw]">
      <EmbedPlayer
        v-if="(modes[cam.id] ?? 'hls') === 'embed' && cam.embed_url"
        :src="cam.embed_url"
        :title="cam.name"
        class="h-full w-full"
      />
      <HlsPlayer
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
      <div class="flex items-start justify-between gap-5 pt-3 pb-2 text-sm lg:text-base">
        <p class="line-clamp-2">{{ cam.name }}</p>

        <ModesInputs :cam="cam" v-model="modes[cam.id]" />
      </div>

      <div class="flex items-center justify-center gap-1.5">
        <p class="flex items-center gap-2 text-right text-xs lg:text-sm">
          Probabilidade de alagamento:
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

      <p class="text-sm">
        Status:
        <span
          :class="
            cam.status.toLowerCase() === 'active'
              ? 'text-[#27CA2C]'
              : cam.status.toLowerCase() === 'offline'
                ? 'text-[#CA2727]'
                : 'text-[#999999]'
          "
        >
          {{ cam.status.charAt(0).toUpperCase() + cam.status.slice(1).toLowerCase() }}
        </span>
      </p>

      <div class="flex justify-center mt-4">
        <BaseButton button-text="Ver mais" @click="goToCamera(cam.id)" />
      </div>
    </div>
  </div>
</template>
