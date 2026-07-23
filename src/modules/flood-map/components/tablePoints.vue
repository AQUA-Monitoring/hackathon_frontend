<script setup lang="ts">
import { useRoute } from 'vue-router'
import { formatDuration } from '@/modules/forecast'
import type { IFloodListItem } from '@/modules/flood-points'

const props = withDefaults(
  defineProps<{
    points: IFloodListItem[]
    externalScroll?: boolean
  }>(),
  { externalScroll: false },
)

const route = useRoute()

function probabilityTone(probability: number) {
  if (probability > 70) {
    return 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200'
  }
  if (probability > 40) {
    return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
}
</script>

<template>
  <section class="grid min-h-0" :class="String(route.name) === 'Administração'
    ? ''
    : props.externalScroll
    ? ''
    : 'max-h-[40%] overflow-y-auto pr-1 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]'
    " aria-label="Pontos atuais"
  >
    <div class="flex items-center justify-between gap-3">
      <h3 class="mt-0.5 text-lg font-semibold">Pontos atuais</h3>
    </div>

    <div v-if="points.length"
      class="max-w-full overflow-x-auto overscroll-x-contain [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]"
      tabindex="0" role="region" aria-label="Tabela de pontos atuais; role horizontalmente quando necessário">
      <table class="w-full min-w-[28rem] table-fixed border-separate border-spacing-y-2">
        <thead class="sticky top-0 z-10 bg-white dark:bg-[#001C3B]">
          <tr class="text-left text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            <th scope="col" class="w-[46%] px-3 py-2">Bairro</th>
            <th scope="col" class="w-[30%] px-3 py-2">Probabilidade</th>
            <th scope="col" class="w-[24%] px-3 py-2 text-right">Duração</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="point in points" :key="point.id" class="text-sm text-slate-700 dark:text-slate-200">
            <td
              class="rounded-l-xl border-y border-l border-slate-200 bg-slate-50 px-3 py-3 font-semibold dark:border-slate-700 dark:bg-[#071F36]">
              <span class="line-clamp-2">{{ point.neighborhood }}</span>
            </td>
            <td class="border-y border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-[#071F36]">
              <span class="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold"
                :class="probabilityTone(point.probability)">
                <span class="size-2 rounded-full bg-current" aria-hidden="true"></span>
                {{
                  point.probability > 70 ? 'Alta' : point.probability > 40 ? 'Média' : 'Baixa'
                }}
              </span>
            </td>
            <td
              class="rounded-r-xl border-y border-r border-slate-200 bg-slate-50 px-3 py-3 text-right font-semibold whitespace-nowrap dark:border-slate-700 dark:bg-[#071F36]">
              {{ formatDuration(point.duration) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else
      class="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-[#071F36] dark:text-slate-200"
      role="status">
      <span class="material-symbols-outlined mt-0.5 shrink-0 text-slate-500" aria-hidden="true">
        water_drop
      </span>
      <div>
        <p class="font-semibold">Nenhum ponto atual</p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Não há pontos cadastrados para exibir neste momento.
        </p>
      </div>
    </div>
  </section>
</template>
