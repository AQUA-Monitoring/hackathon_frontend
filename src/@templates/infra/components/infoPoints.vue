<script setup lang="ts">
import { computed, reactive, onMounted } from 'vue'
import { useFloodCameraMonitoringController } from '@/modules/flood_camera_monitoring/controller/FloodCameraMonitoringController'
import { TablePoints, CameraPoints } from '../components'
import type { IFloodListItem } from '@/@core/types/flood'
import type { ICamera, ViewMode } from '@/@core/types/camera'

defineProps<{
    points: IFloodListItem[]
}>()

const ctrl = useFloodCameraMonitoringController()
const cams = computed<ICamera[]>(() => ctrl.camerasWithPrediction)
const modes = reactive<Record<string, ViewMode>>({})

function displayFloodPercent(cam: ICamera): number {
    if (cam.prediction?.probabilities && typeof cam.prediction.probabilities.flooded === 'number') {
        const v = cam.prediction.probabilities.flooded
        const clamped = Math.min(100, Math.max(0, v))
        return Number(clamped.toFixed(2))
    }
    return cam.flood_percentage
}

const orderedCams = computed(() => {
    return [...cams.value].sort((a, b) => {
        const aOnline = a.status === 'Online'
        const bOnline = b.status === 'Online'

        if (aOnline !== bOnline) return aOnline ? -1 : 1

        const aPct = displayFloodPercent(a)
        const bPct = displayFloodPercent(b)
        if (aPct !== bPct) return bPct - aPct

        return String(a.name || '').localeCompare(String(b.name || ''))
    })
})

onMounted(async () => {
    await ctrl.load()
})
</script>

<template>
    <div class="mt-10 grid lg:flex lg:justify-between">
        <TablePoints :points="points" />
        <CameraPoints :cams="orderedCams" />
    </div>
</template>
