<script setup lang="ts">
import { ref } from 'vue'
import { CameraItems } from '@/@core/components'
import type { ICamera } from '@/@core/interfaces/camera'

const props = defineProps<{
    cams: ICamera[]
}>()

const currentIndex = ref(0)

const next = () => {
    if (currentIndex.value < props.cams.slice(0, 4).length - 1) {
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

function displayFloodPercent(cam: ICamera): number {
    if (cam.prediction?.probabilities && typeof cam.prediction.probabilities.flooded === 'number') {
        const v = cam.prediction.probabilities.flooded
        const clamped = Math.min(100, Math.max(0, v))
        return Number(clamped.toFixed(2))
    }
    return cam.flood_percentage
}
</script>

<template>
    <div class="grid w-full items-center">
        <h3 class="mb-4 text-xl font-bold">Altas probabilidades</h3>

        <div class="relative mx-auto h-[13vw] min-h-[200px] w-[80%] overflow-hidden rounded-2xl">
            <span
                @click="prev"
                class="material-symbols-outlined absolute top-1/2 left-2 z-10 -translate-y-1/2 cursor-pointer text-[#001c3b] dark:text-white"
            >
                chevron_left
            </span>

            <div
                class="flex h-full transition-transform duration-500"
                :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
            >
                <div
                    v-for="cam in cams"
                    :key="cam.id"
                    class="flex min-w-full flex-col items-center justify-center"
                >
                    <div class="flex w-full justify-center">
                        <CameraItems :cam="cam" />
                    </div>
                </div>
            </div>

            <span
                @click="next"
                class="material-symbols-outlined absolute top-1/2 right-2 z-10 -translate-y-1/2 cursor-pointer text-[#001c3b] dark:text-white"
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
                    v-for="cam in cams"
                    :key="cam.id"
                    class="flex min-w-full flex-col items-center justify-center"
                >
                    <div class="text-center">
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
</template>
