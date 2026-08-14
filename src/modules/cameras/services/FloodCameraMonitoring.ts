import api from '@/app/plugins/axios'
import type { Paginated } from '@/types/general/pagination'
import type {
  CameraCatalogFilters,
  CameraDetailDto,
  CameraSummaryDto,
  NearbyCameraDto,
  NearbyCamerasQuery,
} from '../types/camera'

const CAMERA_REQUEST_TIMEOUT_MS = 15_000
const CAMERA_PAGE_SIZE = 100

export default class FloodCameraMonitoringApi {
  private async getCameraPage(
    page: number,
    filters: CameraCatalogFilters,
    signal?: AbortSignal,
  ): Promise<Paginated<CameraSummaryDto>> {
    const { data } = await api.get<Paginated<CameraSummaryDto>>(
      '/flood_monitoring/cameras/',
      {
        params: { ...filters, page, page_size: CAMERA_PAGE_SIZE },
        signal,
        timeout: CAMERA_REQUEST_TIMEOUT_MS,
      },
    )

    const results = Array.isArray(data?.results) ? data.results : []
    return {
      count: data?.count ?? results.length,
      next: data?.next ?? null,
      previous: data?.previous ?? null,
      ordering: data?.ordering ?? null,
      results,
    }
  }

  async getAllCameras(
    filters: CameraCatalogFilters = {},
    signal?: AbortSignal,
  ): Promise<CameraSummaryDto[]> {
    const cameras: CameraSummaryDto[] = []
    const visitedNextUrls = new Set<string>()
    let page = 1
    let response = await this.getCameraPage(page, filters, signal)

    cameras.push(...response.results)
    while (response.next) {
      if (visitedNextUrls.has(response.next)) {
        throw new Error('A paginação de câmeras retornou uma página repetida.')
      }
      visitedNextUrls.add(response.next)
      page += 1
      response = await this.getCameraPage(page, filters, signal)
      cameras.push(...response.results)
    }

    return cameras
  }

  async getCamera(id: string, signal?: AbortSignal): Promise<CameraDetailDto> {
    const { data } = await api.get<CameraDetailDto>(`/flood_monitoring/cameras/${id}/`, {
      signal,
      timeout: CAMERA_REQUEST_TIMEOUT_MS,
    })
    return data
  }

  async getNearbyCameras(
    id: string,
    query: NearbyCamerasQuery = {},
    signal?: AbortSignal,
  ): Promise<Paginated<NearbyCameraDto> & { radius_m: number }> {
    const { data } = await api.get<Paginated<NearbyCameraDto> & { radius_m: number }>(
      `/flood_monitoring/cameras/${id}/nearby/`,
      {
        params: query,
        signal,
        timeout: CAMERA_REQUEST_TIMEOUT_MS,
      },
    )
    const results = Array.isArray(data?.results) ? data.results : []
    return {
      count: data?.count ?? results.length,
      next: data?.next ?? null,
      previous: data?.previous ?? null,
      ordering: data?.ordering ?? 'distance',
      radius_m: data?.radius_m ?? query.radius_m ?? 5_000,
      results,
    }
  }
}
