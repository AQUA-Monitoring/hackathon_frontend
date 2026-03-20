<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { useFloodCameraMonitoringController } from '@/modules/flood_camera_monitoring/controller/FloodCameraMonitoringController'
import { CameraItems } from '@/@core/components'
import type { IFloodListItem } from '@/@core/types/flood'

defineProps<{
    points: IFloodListItem[]
}>()

type ViewMode = 'embed' | 'hls'
const ctrl = useFloodCameraMonitoringController()
const cams = computed(() => ctrl.camerasWithPrediction)

const modes = reactive<Record<string, ViewMode>>({})
const orderedCams = computed(() => {
    return [...cams.value].sort((a, b) => {
        const aOnline = a.status === 'Online'
        const bOnline = b.status === 'Online'
        if (aOnline !== bOnline) return aOnline ? -1 : 1
        const aPct = displayFloodPercent(a as any)
        const bPct = displayFloodPercent(b as any)
        if (aPct !== bPct) return bPct - aPct
        return String(a.name || '').localeCompare(String(b.name || ''))
    })
})
function displayFloodPercent(cam: any): number {
    if (cam.prediction && typeof cam.prediction.probabilities?.flooded === 'number') {
        const v = cam.prediction.probabilities.flooded
        const clamped = Math.min(100, Math.max(0, v))
        return Number(clamped.toFixed(2))
    }
    return cam.flood_percentage
}

const currentIndex = ref(0)
const next = () => {
    if (currentIndex.value < orderedCams.value.slice(0, 4).length - 1) {
        currentIndex.value++
    } else {
        currentIndex.value = 0
    }
}
const prev = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--
    } else {
        currentIndex.value = 3
    }
}

// Normaliza probabilidade (aceita 0..1 ou 0..100)
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
    <div class="mt-10 grid lg:flex lg:justify-between">
        <div class="grid items-center lg:w-1/2 lg:pr-4">
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

        <div class="grid w-full items-center lg:w-1/2 lg:pl-4">
            <h3 class="mb-4 text-xl font-bold">Altas probabilidades</h3>

            <div
                class="relative mx-auto h-[15vw] min-h-[200px] w-[80%] overflow-hidden rounded-2xl"
            >
                <span
                    @click="prev"
                    class="material-symbols-outlined absolute top-1/2 left-2 z-10 -translate-y-1/2 cursor-pointer text-white"
                >
                    chevron_left
                </span>

                <div
                    class="flex h-full transition-transform duration-500"
                    :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
                >
                    <div
                        v-for="cam in orderedCams"
                        :key="cam.id"
                        class="flex min-w-full flex-col items-center justify-center"
                    >
                        <div class="mb-4 flex w-full justify-center">
                            <CameraItems :item="cam" />
                        </div>
                    </div>
                </div>

                <span
                    @click="next"
                    class="material-symbols-outlined absolute top-1/2 right-2 z-10 -translate-y-1/2 cursor-pointer text-white"
                >
                    chevron_right
                </span>
            </div>
            <div class="relative mx-auto w-[80%] overflow-hidden">
                <div
                    class="flex h-full transition-transform duration-500"
                    :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
                >
                    <div
                        v-for="cam in orderedCams"
                        :key="cam.id"
                        class="flex min-w-full flex-col items-center justify-center"
                    >
                        <div class="text-center lg:mt-4">
                            <p class="font-semibold">Situação:</p>
                            <p :class="riskClass(displayFloodPercent(cam))">
                                {{ riskLabel(displayFloodPercent(cam)) }}
                            </p>
                            <p class="text-sm text-[#666]">
                                Risco: {{ riskLevel(displayFloodPercent(cam)) }} ({{
                                    displayPercent(displayFloodPercent(cam))
                                }}%)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
