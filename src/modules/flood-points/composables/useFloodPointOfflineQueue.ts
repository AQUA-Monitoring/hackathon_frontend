import { computed, ref } from 'vue'
import FloodPointsApi from '../services/FloodPoints'
import type { CreateFloodPointPayload } from '../types/floodPoints'
import { isReferenceBaseChangedError, parseTerritoryApiError } from '@/modules/addressing'

const STORAGE_KEY = 'aqua:flood-point-offline-queue'
const CURRENT_QUEUE_VERSION = 2 as const

interface QueuedFloodPoint {
  version: 1 | typeof CURRENT_QUEUE_VERSION
  id: string
  createdAt: string
  payload: CreateFloodPointPayload
}

interface PersistedQueue {
  version: typeof CURRENT_QUEUE_VERSION
  items: QueuedFloodPoint[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeQueuedItem = (value: unknown, fallbackVersion: 1 | 2): QueuedFloodPoint | null => {
  if (!isRecord(value) || !isRecord(value.payload)) return null

  const payload = value.payload
  if (
    typeof payload.city !== 'string' ||
    typeof payload.neighborhood !== 'string' ||
    typeof payload.possibility !== 'number' ||
    typeof payload.duration !== 'number' ||
    typeof payload.finished_at !== 'string' ||
    !Array.isArray(payload.props)
  ) {
    return null
  }

  return {
    version: value.version === CURRENT_QUEUE_VERSION ? CURRENT_QUEUE_VERSION : fallbackVersion,
    id: typeof value.id === 'string' ? value.id : `${Date.now()}-${Math.random()}`,
    createdAt:
      typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    payload: {
      city: payload.city,
      neighborhood: payload.neighborhood,
      possibility: payload.possibility,
      duration: payload.duration,
      finished_at: payload.finished_at,
      props: payload.props as CreateFloodPointPayload['props'],
      ...(payload.location === null || isRecord(payload.location)
        ? { location: payload.location as CreateFloodPointPayload['location'] }
        : {}),
      ...(payload.footprint === null || isRecord(payload.footprint)
        ? { footprint: payload.footprint as CreateFloodPointPayload['footprint'] }
        : {}),
      ...(typeof payload.reference_base_revision === 'string'
        ? { reference_base_revision: payload.reference_base_revision }
        : {}),
    },
  }
}

const readQueue = (): QueuedFloodPoint[] => {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => normalizeQueuedItem(item, 1))
        .filter((item): item is QueuedFloodPoint => item !== null)
    }
    if (!isRecord(parsed) || parsed.version !== CURRENT_QUEUE_VERSION || !Array.isArray(parsed.items)) {
      return []
    }
    return parsed.items
      .map((item) => normalizeQueuedItem(item, CURRENT_QUEUE_VERSION))
      .filter((item): item is QueuedFloodPoint => item !== null)
  } catch {
    return []
  }
}

const queue = ref<QueuedFloodPoint[]>(readQueue())
const syncing = ref(false)

const persist = () => {
  if (queue.value.length) {
    const stored: PersistedQueue = {
      version: CURRENT_QUEUE_VERSION,
      items: queue.value,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function useFloodPointOfflineQueue() {
  const enqueue = (payload: CreateFloodPointPayload) => {
    queue.value.push({
      version: CURRENT_QUEUE_VERSION,
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      payload,
    })
    persist()
  }

  const flush = async () => {
    if (syncing.value || !navigator.onLine || !queue.value.length) {
      return {
        synced: 0,
        remaining: queue.value.length,
        referenceBaseConflict: false,
        errorMessage: null,
      }
    }

    syncing.value = true
    const api = new FloodPointsApi()
    let synced = 0
    let referenceBaseConflict = false
    let errorMessage: string | null = null

    try {
      for (const item of queue.value.slice()) {
        try {
          await api.createFloodPoint(item.payload)
          queue.value = queue.value.filter((queued) => queued.id !== item.id)
          synced += 1
          persist()
        } catch (error: unknown) {
          referenceBaseConflict = isReferenceBaseChangedError(error)
          errorMessage = referenceBaseConflict
            ? null
            : parseTerritoryApiError(
                error,
                'Não foi possível sincronizar o alerta de alagamento.',
              ).message
          break
        }
      }
    } finally {
      syncing.value = false
    }

    return {
      synced,
      remaining: queue.value.length,
      referenceBaseConflict,
      errorMessage,
    }
  }

  return {
    queue: computed(() => queue.value),
    pendingCount: computed(() => queue.value.length),
    syncing: computed(() => syncing.value),
    enqueue,
    flush,
  }
}
