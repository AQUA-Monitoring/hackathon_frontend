import axios from 'axios'
import { parseApiError } from '@/shared'

export const REFERENCE_BASE_LABEL = 'Base Territorial de Referência'

export const REFERENCE_BASE_TEXT = {
  loading: `Consultando a ${REFERENCE_BASE_LABEL}`,
  confirmed: REFERENCE_BASE_LABEL,
  localFallback: 'Referência territorial local',
  unavailable: `${REFERENCE_BASE_LABEL} indisponível`,
  confirmedDescription: `Cidade e bairro vêm da ${REFERENCE_BASE_LABEL}; o mapa é apenas um apoio visual.`,
  unavailableDescription: `A ${REFERENCE_BASE_LABEL} está indisponível. A localização exibida é apenas uma referência local e deve ser confirmada.`,
  unresolvedDescription: `Não foi possível identificar o território na ${REFERENCE_BASE_LABEL}. Tente novamente quando ela estiver disponível.`,
  waitToPublish: `Aguarde a ${REFERENCE_BASE_LABEL} para publicar este alerta.`,
  invalidArea: `A área precisa corresponder a uma cidade e um bairro da ${REFERENCE_BASE_LABEL}.`,
  changed: `A ${REFERENCE_BASE_LABEL} foi atualizada. Recarregue a página e revise a área antes de publicar.`,
} as const

export interface TerritoryApiErrorInfo {
  status?: number
  code?: string
  message: string
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null

export function parseTerritoryApiError(
  error: unknown,
  fallbackMessage = 'Não foi possível consultar o território.',
): TerritoryApiErrorInfo {
  const parsed = parseApiError(error, fallbackMessage)
  if (!axios.isAxiosError(error)) return parsed

  const payload = asRecord(error.response?.data)
  const nestedError = asRecord(payload?.error)
  const nestedDetail = asRecord(payload?.detail)
  const code = [payload?.code, nestedError?.code, nestedDetail?.code].find(
    (value): value is string => typeof value === 'string',
  )
  const detail = [payload?.detail, nestedError?.detail, nestedDetail?.detail].find(
    (value): value is string => typeof value === 'string' && Boolean(value.trim()),
  )

  return {
    status: parsed.status,
    code,
    message: detail ?? parsed.message,
  }
}

export const isReferenceBaseChangedError = (error: unknown): boolean => {
  const parsed = parseTerritoryApiError(error)
  return parsed.status === 409 && parsed.code === 'REFERENCE_BASE_CHANGED'
}
