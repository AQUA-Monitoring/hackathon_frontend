import api from '@/plugins/axios'
import type { ICamera } from '@/types/camera'

export default class FloodCameraMonitoringApi {
  async getAllCameras(page = 1) {
    const { data } = await api.get('/flood_monitoring/cameras/', {
      params: { page },
    })

    const rawResults = Array.isArray(data?.results) ? data.results : []

    const results: ICamera[] = rawResults.map((c: any) => ({
      id: c.id,
      name: c.description ?? c.name ?? 'Câmera',
      hls_url: c.video_hls ?? '',
      embed_url: c.video_embed,
      flood_percentage: 0,
      status: c.status === 'ACTIVE' ? 'Online' : (c.status ?? 'Offline'),
      link: '/cameras',
      latitude: Number.isFinite(c.latitude) ? c.latitude : 0,
      longitude: Number.isFinite(c.longitude) ? c.longitude : 0,
    }))

    return {
      total: data?.count ?? results.length,
      next: data?.next ?? null,
      previous: data?.previous ?? null,
      results,
    }
  }
}
