import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'
import type { CameraWithPrediction } from '@/types/predictions'

export function useCamerasMonitoring() {
  const store = useFloodCameraMonitoringStore()
  const intervalMs = 60000

  onMounted(async () => {
    await store.load()
    store.startPolling(intervalMs)
  })

  onBeforeUnmount(() => {
    store.stopPolling()
  })

  const camerasWithPrediction = computed<CameraWithPrediction[]>(() => store.camerasWithPrediction)

  const statusCounters = computed(() => {
    let active = 0
    let offline = 0
    for (const cam of camerasWithPrediction.value) {
      if (cam.status === 'ACTIVE') active++
      else if (cam.status === 'OFFLINE') offline++
    }
    return { active, offline }
  })

  return {
    camerasWithPrediction,
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    refresh: store.refreshPredictions,
    startPolling: store.startPolling,
    stopPolling: store.stopPolling,
    statusCounters,
  }
}

export const displayPercent = (p: number) => Math.round(p)

export const riskLabel = (prob: number) => {
  const p = prob
  if (p > 70) return 'Alta probabilidade de risco'
  if (p > 40) return 'Média probabilidade de risco'
  return 'Baixa probabilidade de risco'
}

export const riskLevel = (prob: number) => {
  const p = prob
  if (p > 70) return 'Alto'
  if (p > 40) return 'Médio'
  return 'Baixo'
}

export const riskClass = (prob: number) => {
  const p = prob
  if (p > 70) return 'text-red-600 font-bold text-lg'
  if (p > 40) return 'text-yellow-500 font-bold text-lg'
  return 'text-green-600 font-bold text-lg'
}

export function displayFloodPercent(cam: CameraWithPrediction): number {
  if (cam.prediction?.probabilities && typeof cam.prediction.probabilities.flooded === 'number') {
    const v = cam.prediction.probabilities.flooded
    const clamped = Math.min(100, Math.max(0, v))
    return Number(clamped.toFixed(2))
  }
  return cam.flood_percentage
}

export function formatFloodPercent(cam: CameraWithPrediction): string {
  return displayFloodPercent(cam).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
