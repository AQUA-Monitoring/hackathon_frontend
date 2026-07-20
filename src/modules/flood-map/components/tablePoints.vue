<script setup lang="ts">
import { useRoute } from 'vue-router'
import { formatDuration } from '@/modules/forecast'
import type { IFloodListItem } from '@/modules/flood-points'

defineProps<{
  points: IFloodListItem[]
}>()

const route = useRoute()
</script>

<template>
  <div
    :class="[String(route.name) === 'Administração' ? '' : 'max-h-[40%] overflow-y-auto', 'grid']"
  >
    <h3 class="mb-2 text-xl font-bold">Pontos atuais</h3>

    <table class="mx-auto w-full table-fixed border-separate border-spacing-y-5">
      <thead class="sticky top-0 z-10 bg-white dark:bg-[#001C3B]">
        <tr class="text-center font-semibold text-[#999999]">
          <th class="py-2">Bairro</th>
          <th class="py-2">Probabilidade</th>
          <th class="py-2">Duração</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="point in points" :key="point.id" class="text-center font-semibold">
          <td class="py-2 text-sm">{{ point.neighborhood }}</td>
          <td
            class="rounded-2xl py-2 text-sm"
            :class="
              point.probability > 70
                ? 'bg-[#FF000061] text-[#FF0000]'
                : point.probability > 40
                  ? 'bg-[#FFE10130] text-[#FFE101]'
                  : 'bg-[#87FD8B] text-[#0F9900]'
            "
          >
            {{ point.probability > 70 ? 'Alta' : point.probability > 40 ? 'Média' : 'Baixa' }}
          </td>
          <td class="py-2 text-sm">{{ formatDuration(point.duration) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
