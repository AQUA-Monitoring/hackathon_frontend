import api from '@/app/plugins/axios'
import type { Paginated } from '@/types/general/pagination'
import type { CameraApiItem } from '../types/camera'

export default class FloodCameraMonitoringApi {
  async getAllCameras(page = 1): Promise<Paginated<CameraApiItem>> {
    const { data } = await api.get<Paginated<CameraApiItem>>('/flood_monitoring/cameras/', {
      params: { page },
    })

    const results = Array.isArray(data?.results) ? data.results : []

    return {
      count: data?.count ?? results.length,
      next: data?.next ?? null,
      previous: data?.previous ?? null,
      ordering: data?.ordering ?? null,
      results,
    }
  }
}
