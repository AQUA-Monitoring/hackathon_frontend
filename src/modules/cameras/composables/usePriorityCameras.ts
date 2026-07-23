import { onBeforeUnmount, onMounted, ref } from 'vue'
import { parseApiError } from '@/shared'
import FloodCameraMonitoringApi from '../FloodCameraMonitoringApi'
import type { CameraApiItem } from '../types/camera'
import { orderHomeCameraCatalog } from '../utils/priorityCameras'

export type PriorityCameraDetailResult =
  | { camera: CameraApiItem; error: null }
  | { camera: null; error: string }

let cachedCatalog: CameraApiItem[] = []
let catalogCompletedAt = 0

export function usePriorityCameras(
  options: { autoLoad?: boolean; autoRevalidate?: boolean } = {},
) {
  const api = new FloodCameraMonitoringApi()
  const cameras = ref<CameraApiItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let listRequest = 0
  let detailRequest = 0
  let listController: AbortController | null = null
  let detailController: AbortController | null = null
  let catalogTimer: number | null = null

  async function load(force = false) {
    if (!force && cachedCatalog.length && Date.now() - catalogCompletedAt < 300_000) {
      cameras.value = cachedCatalog
      return
    }
    const request = ++listRequest
    listController?.abort()
    listController = new AbortController()
    loading.value = true
    error.value = null
    try {
      const all: CameraApiItem[] = []
      const nextUrls = new Set<string>()
      let page = 1
      let response = await api.getAllCameras(page, listController.signal)
      all.push(...response.results)
      while (response.next && page < 100 && !nextUrls.has(response.next)) {
        nextUrls.add(response.next)
        response = await api.getAllCameras(++page, listController.signal)
        all.push(...response.results)
      }
      if (request === listRequest) {
        cameras.value = orderHomeCameraCatalog(all)
        cachedCatalog = cameras.value
        catalogCompletedAt = Date.now()
      }
    } catch (reason) {
      if (request === listRequest) {
        if (!cameras.value.length && cachedCatalog.length) cameras.value = cachedCatalog
        error.value = parseApiError(
          reason,
          'Não foi possível carregar o monitoramento por câmeras.',
        ).message
      }
    } finally {
      if (request === listRequest) loading.value = false
    }
  }

  async function loadDetail(
    camera: CameraApiItem,
  ): Promise<PriorityCameraDetailResult | null> {
    const request = ++detailRequest
    detailController?.abort()
    detailController = new AbortController()
    try {
      const detail = await api.getCamera(camera.id, detailController.signal)
      if (request !== detailRequest) return null
      return { camera: detail, error: null }
    } catch (reason) {
      if (request !== detailRequest) return null
      return {
        camera: null,
        error: parseApiError(
          reason,
          'Não foi possível carregar os detalhes desta câmera.',
        ).message,
      }
    }
  }

  onMounted(() => {
    if (options.autoLoad !== false) void load()
    if (options.autoRevalidate === false) return
    const revalidate = () => {
      if (
        document.visibilityState === 'visible' &&
        navigator.onLine &&
        Date.now() - catalogCompletedAt > 30_000
      ) {
        void load(true)
      }
    }
    catalogTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) void load(true)
    }, 300_000)
    window.addEventListener('focus', revalidate)
    window.addEventListener('online', revalidate)
    document.addEventListener('visibilitychange', revalidate)
    cleanup = () => {
      window.removeEventListener('focus', revalidate)
      window.removeEventListener('online', revalidate)
      document.removeEventListener('visibilitychange', revalidate)
    }
  })

  let cleanup = () => undefined
  onBeforeUnmount(() => {
    listRequest += 1
    detailRequest += 1
    listController?.abort()
    detailController?.abort()
    if (catalogTimer !== null) window.clearInterval(catalogTimer)
    cleanup()
  })

  return { cameras, loading, error, load, loadDetail }
}
