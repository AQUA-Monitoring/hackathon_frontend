<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HlsPlayer } from '.'
import { BaseButton } from '@/components'
import { formatFloodPercent, riskClass } from '@/utils/flood'
import type { CameraSummary } from '../types/camera'

defineProps<{
  cam: CameraSummary
}>()

const router = useRouter()

function goToCamera(id: string) {
  router.push(`/cameras/${id}`)
}
</script>

<template>
  <div class="rounded-2xl bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.40)] dark:bg-[#001C3B]">
    <div class="overflow-hidden rounded-3xl lg:h-[10vw]">
      <HlsPlayer
        v-if="cam.previewUrl"
        :src="cam.previewUrl"
        :muted="true"
        :controls="true"
        :lock-to-live="true"
        :live-delay="18"
        class="h-full w-full"
      />
      <div v-else class="grid h-full min-h-36 place-items-center bg-[#00182F] text-sm text-white">
        Prévia indisponível
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 px-4">
      <div class="flex items-start justify-between gap-5 pt-3 pb-2 text-sm lg:text-base">
        <p class="line-clamp-2">{{ cam.name }}</p>

      </div>

      <div class="flex items-center justify-center gap-1.5">
        <p class="flex items-center gap-2 text-right text-xs lg:text-sm">
          Probabilidade de alagamento:
          <span
            class="text-2xl font-semibold"
            :class="riskClass(cam.floodPercentage)"
            >{{ formatFloodPercent(cam) }}</span
          >
        </p>
      </div>

      <p class="text-sm">
        Status:
        <span
          :class="
            cam.status === 'ACTIVE'
              ? 'text-[#27CA2C]'
              : cam.status === 'OFFLINE'
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
