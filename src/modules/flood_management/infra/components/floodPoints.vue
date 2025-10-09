<script setup lang="ts">
import { onMounted } from 'vue'

type FloodListItem = {
    id: string | number
    neighborhood: string
    duration: number
    createdAt?: string
}

defineProps<{
    points: FloodListItem[]
}>()

const normProb = (p: number) => (p > 1 ? p / 100 : p)
const displayPercent = (p: number) => Math.round(normProb(p) * 100)
const riskLabel = (prob: number) => {
    const p = normProb(prob)
    if (p > 0.7) return 'Alta probabilidade de risco'
    if (p > 0.4) return 'Média probabilidade de risco'
    return 'Baixa probabilidade de risco'
}
const riskLevel = (prob: number) => {
    const p = normProb(prob)
    if (p > 0.7) return 'Alto'
    if (p > 0.4) return 'Médio'
    return 'Baixo'
}
const riskClass = (prob: number) => {
    const p = normProb(prob)
    if (p > 0.7) return 'text-red-600 font-bold text-lg'
    if (p > 0.4) return 'text-yellow-500 font-bold text-lg'
    return 'text-green-600 font-bold text-lg'
}

onMounted(async () => {
    await ctrl.load()
    cams.value.forEach((c: any) => {
        modes[c.id] = 'hls'
    })
})
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
    <h3 class="font-semibold text-[#999999]">Pontos atuais</h3>

    <table class="w-full table-fixed border-separate border-spacing-y-5 overflow-hidden">
        <thead>
            <tr class="text-center font-semibold text-[#999999] lg:text-lg">
                <th class="py-2">Bairro</th>
                <th class="py-2">Probabilidade</th>
                <th class="py-2">Duração</th>
            </tr>
        </thead>

        <tbody>
            <tr v-for="point in points" :key="point.id" class="text-center font-semibold">
                <td class="py-2">{{ point.neighborhood }}</td>
                <td
                    class="rounded-2xl py-2"
                    :class="
                        point.probability > 70
                            ? 'bg-[#FF000061] text-[#FF0000]'
                            : point.probability > 40
                              ? 'bg-[#FFE10130] text-[#FFE101]'
                              : 'bg-[#87FD8B] text-[#0F9900]'
                    "
                >
                    {{
                        point.probability > 70 ? 'Alta' : point.probability > 40 ? 'Média' : 'Baixa'
                    }}
                </td>
                <td class="py-2">{{ formatDuration(point.duration) }}</td>
            </tr>
        </tbody>
    </table>
</template>
