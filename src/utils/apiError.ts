import axios from 'axios'

export interface ApiErrorInfo {
  status?: number
  detail?: string
  message: string
}

const DEFAULT_MESSAGE = 'Nao foi possivel concluir a operacao.'

function normalizeText(value?: string): string | undefined {
  if (!value) return undefined
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function firstValidationMessage(value: unknown, path = ''): string | undefined {
  if (typeof value === 'string') return path ? `${path}: ${value}` : value
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstValidationMessage(item, path)
      if (message) return message
    }
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      const message = firstValidationMessage(item, path ? `${path}.${key}` : key)
      if (message) return message
    }
  }
  return undefined
}

export function parseApiError(error: unknown, fallbackMessage = DEFAULT_MESSAGE): ApiErrorInfo {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as Record<string, unknown> | undefined
    const detail =
      (typeof data?.detail === 'string' && data.detail) ||
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error)
    const validationMessage = firstValidationMessage(data)
    const resolvedDetail = typeof detail === 'string' ? detail : validationMessage
    const detailNormalized = normalizeText(resolvedDetail)

    if (status === 401 && detailNormalized === 'Credenciais invalidas') {
      return { status, detail: resolvedDetail, message: 'E-mail ou senha invalidos.' }
    }

    if (status === 401 && detail === 'Token is invalid or expired') {
      return { status, detail: resolvedDetail, message: 'Sessao expirada. Faca login novamente.' }
    }

    if (status === 401) {
      return { status, detail: resolvedDetail, message: 'Nao autorizado. Faca login novamente.' }
    }

    if (status === 403) {
      return { status, detail, message: 'Voce nao tem permissao para esta acao.' }
    }

    if (status === 404) {
      return { status, detail: resolvedDetail, message: 'Usuario nao encontrado.' }
    }

    if (resolvedDetail) {
      return { status, detail: resolvedDetail, message: resolvedDetail }
    }

    return { status, detail, message: fallbackMessage }
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage }
  }

  return { message: fallbackMessage }
}
