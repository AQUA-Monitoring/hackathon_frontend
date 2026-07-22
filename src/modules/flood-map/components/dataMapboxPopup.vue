<script setup lang="ts">
import { CameraItems } from '@/modules/cameras'
import { useCamerasMonitoring } from '@/modules/cameras'
import {
  formatNeighborhoodProportion,
  type FloodPointNeighborhood,
} from '@/modules/flood-points'
import { REFERENCE_BASE_LABEL } from '@/modules/addressing'

defineProps<{
  neighborhood: string | null
  city: string | null
  probability?: number | null
  neighborhoods?: FloodPointNeighborhood[]
  referenceBaseRevision?: string | null
}>()

const { camerasWithPrediction } = useCamerasMonitoring()
</script>

<template>
  <div
    class="absolute bottom-25 left-1/2 flex max-h-[45vh] w-[90%] -translate-x-1/2 gap-5 overflow-y-auto rounded-2xl bg-white p-4 dark:bg-[#001C3B]"
  >
    <div v-if="camerasWithPrediction[0]" class="flex w-[50%] justify-center rounded-2xl overflow-hidden">
      <CameraItems :cam="camerasWithPrediction[0]" />
    </div>

    <div class="grid min-w-0 flex-1 gap-3 text-[#999999]">
      <div>
        <h4 class="text-black dark:text-white text-lg font-semibold">{{ neighborhood }}</h4>
        <p class="flex gap-1 items-center text-sm">
          <span class="material-symbols-outlined scale-90"> location_on </span> {{ city }}
        </p>
      </div>
      <p class="grid gap-1 items-center text-xs font-semibold">
        Probablidade
        <span class="text-2xl text-[#FF2020] font-bold">{{ probability ?? 0 }}%</span>
      </p>
      <section
        v-if="neighborhoods && neighborhoods.length > 1"
        aria-labelledby="flood-neighborhoods-title"
        class="border-t border-[#DCDCDC] pt-2 dark:border-[#31516D]"
      >
        <h5 id="flood-neighborhoods-title" class="text-xs font-semibold text-black dark:text-white">
          Bairros abrangidos
        </h5>
        <ul class="mt-1 grid gap-1 text-xs">
          <li
            v-for="item in neighborhoods"
            :key="item.id || item.name"
            class="flex justify-between gap-3"
          >
            <span class="text-black dark:text-white">
              {{ item.name }}<span v-if="item.isPrimary"> (principal)</span>
            </span>
            <span>
              {{
                formatNeighborhoodProportion(item.footprintFraction) ??
                'proporção não informada'
              }}
            </span>
          </li>
        </ul>
        <p v-if="referenceBaseRevision" class="mt-2 text-[10px]">
          {{ REFERENCE_BASE_LABEL }}: {{ referenceBaseRevision }}
        </p>
      </section>
    </div>
  </div>
</template>
