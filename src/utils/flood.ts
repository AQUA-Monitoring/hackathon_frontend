import type { CameraSummary } from '@/modules/cameras'

export const displayPercent = (probability: number | null): number | null =>
  probability === null ? null : Math.round(probability)

export const riskLabel = (camera: CameraSummary): string => {
  const probability = camera.floodPercentage
  if (probability === null) return 'Probabilidade indisponível'
  const stale = camera.operational.analysisStatus === 'STALE' ? ' desatualizada' : ''
  if (probability > 70) return `Alta probabilidade de risco${stale}`
  if (probability > 40) return `Média probabilidade de risco${stale}`
  return `Baixa probabilidade de risco${stale}`
}

export const riskLevel = (probability: number | null): string => {
  if (probability === null) return 'Indisponível'
  if (probability > 70) return 'Alto'
  if (probability > 40) return 'Médio'
  return 'Baixo'
}

export const riskClass = (probability: number | null): string => {
  if (probability === null) return 'text-slate-500 font-semibold'
  if (probability > 70) return 'text-red-600 font-bold text-lg'
  if (probability > 40) return 'text-yellow-500 font-bold text-lg'
  return 'text-green-600 font-bold text-lg'
}

export function displayFloodPercent(camera: CameraSummary): number | null {
  const probability = camera.floodPercentage
  if (probability === null || !Number.isFinite(probability)) return null
  return Number(Math.min(100, Math.max(0, probability)).toFixed(2))
}

export function formatFloodPercent(camera: CameraSummary): string {
  const probability = displayFloodPercent(camera)
  if (probability === null) return 'Indisponível'
  const formatted = probability.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return camera.operational.analysisStatus === 'STALE'
    ? `${formatted}% · desatualizada`
    : `${formatted}%`
}
