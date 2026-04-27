<script setup lang="ts">
import type { IFloodListItem } from '@/@core/interfaces/flood'

defineProps<{
    points: IFloodListItem[]
}>()

function formatDuration(mins?: number) {
    if (!mins && mins !== 0) return '-'
    const m = Math.max(0, Math.trunc(mins))
    if (m < 60) return `${m} min`
    const h = Math.floor(m / 60)
    const rest = m % 60
    return `${h}h ${rest}m`
}
</script>

<template>
    <div class="grid">
        <h3 class="mb-4 text-xl font-bold">Pontos atuais</h3>

        <table
            class="mx-auto w-full table-fixed border-separate border-spacing-y-5 overflow-hidden"
        >
            <thead>
                <tr class="text-center font-semibold text-[#999999] lg:text-lg">
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
                        {{
                            point.probability > 70
                                ? 'Alta'
                                : point.probability > 40
                                  ? 'Média'
                                  : 'Baixa'
                        }}
                    </td>
                    <td class="py-2 text-sm">{{ formatDuration(point.duration) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
