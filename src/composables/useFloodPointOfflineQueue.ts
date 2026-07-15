import { computed, ref } from 'vue'
import FloodPointsApi from '@/services/FloodPoints'
import type { CreateFloodPointPayload } from '@/types/floodPoints'

const STORAGE_KEY = 'aqua:flood-point-offline-queue'

interface QueuedFloodPoint {
  id: string
  createdAt: string
  payload: CreateFloodPointPayload
}

const readQueue = (): QueuedFloodPoint[] => {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as QueuedFloodPoint[]) : []
  } catch {
    return []
  }
}

const queue = ref<QueuedFloodPoint[]>(readQueue())
const syncing = ref(false)

const persist = () => {
  if (queue.value.length) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.value))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function useFloodPointOfflineQueue() {
  const enqueue = (payload: CreateFloodPointPayload) => {
    queue.value.push({
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      payload,
    })
    persist()
  }

  const flush = async () => {
    if (syncing.value || !navigator.onLine || !queue.value.length) {
      return { synced: 0, remaining: queue.value.length }
    }

    syncing.value = true
    const api = new FloodPointsApi()
    let synced = 0

    try {
      for (const item of [...queue.value]) {
        try {
          await api.createFloodPoint(item.payload)
          queue.value = queue.value.filter((queued) => queued.id !== item.id)
          synced += 1
          persist()
        } catch {
          break
        }
      }
    } finally {
      syncing.value = false
    }

    return { synced, remaining: queue.value.length }
  }

  return {
    queue: computed(() => queue.value),
    pendingCount: computed(() => queue.value.length),
    syncing: computed(() => syncing.value),
    enqueue,
    flush,
  }
}
