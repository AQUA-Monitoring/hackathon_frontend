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

export function parseApiError(error: unknown, fallbackMessage = DEFAULT_MESSAGE): ApiErrorInfo {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as { detail?: string; message?: string; error?: string } | undefined
    const detail = data?.detail ?? data?.message ?? data?.error
    const detailNormalized = normalizeText(detail)

    if (status === 401 && detailNormalized === 'Credenciais invalidas') {
      return { status, detail, message: 'E-mail ou senha invalidos.' }
    }

    if (status === 401 && detail === 'Token is invalid or expired') {
      return { status, detail, message: 'Sessao expirada. Faca login novamente.' }
    }

    if (status === 401) {
      return { status, detail, message: 'Nao autorizado. Faca login novamente.' }
    }

    if (status === 403) {
      return { status, detail, message: 'Voce nao tem permissao para esta acao.' }
    }

    if (status === 404) {
      return { status, detail, message: 'Usuario nao encontrado.' }
    }

    if (detail) {
      return { status, detail, message: detail }
    }

    return { status, detail, message: fallbackMessage }
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage }
  }

  return { message: fallbackMessage }
}
