import api from '@/plugins/axios'
import type { Paginated } from '@/types/general/pagination'
import type {
  CameraApiItem,
  AddressResolutionDto,
  CameraCreatePayload,
  CameraListFilters,
  CityDto,
  NeighborhoodDto,
  NearbyCamerasResponse,
} from '@/types/camera'

interface RegionsNeighborhoodsResponse {
  regions?: Array<{
    id: string
    name: string
    neighborhoods?: Array<{ id: string; name: string; city_id?: string | null }>
  }>
  neighborhoods?: NeighborhoodDto[]
}

function compactParams(filters: CameraListFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined),
  )
}

function unwrapList<T>(data: T[] | Paginated<T>): T[] {
  if (Array.isArray(data)) return data
  return Array.isArray(data?.results) ? data.results : []
}

export default class FloodCameraMonitoringApi {
  async getCameras(filters: CameraListFilters = {}): Promise<Paginated<CameraApiItem>> {
    const { data } = await api.get<Paginated<CameraApiItem>>('/flood_monitoring/cameras/', {
      params: compactParams(filters),
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

  async getAllCameras(page = 1): Promise<Paginated<CameraApiItem>> {
    return this.getCameras({ page })
  }

  async getCamera(id: string): Promise<CameraApiItem> {
    const { data } = await api.get<CameraApiItem>(`/flood_monitoring/cameras/${id}/`)
    return data
  }

  async getNearbyCameras(id: string, radiusM = 5000, pageSize = 6): Promise<NearbyCamerasResponse> {
    const { data } = await api.get<NearbyCamerasResponse>(
      `/flood_monitoring/cameras/${id}/nearby/`,
      { params: { radius_m: radiusM, page_size: pageSize } },
    )
    return data
  }

  async createCamera(payload: CameraCreatePayload): Promise<CameraApiItem> {
    const { data } = await api.post<CameraApiItem>('/flood_monitoring/cameras/', payload)
    return data
  }

  async getCities(): Promise<CityDto[]> {
    const { data } = await api.get<CityDto[] | Paginated<CityDto>>('/addressing/cities/')
    return unwrapList(data)
  }

  async getNeighborhoods(cityId?: string): Promise<NeighborhoodDto[]> {
    const { data } = await api.get<RegionsNeighborhoodsResponse>(
      '/addressing/regions-neighborhoods/',
      { params: cityId ? { city_id: cityId } : undefined },
    )
    if (Array.isArray(data.neighborhoods)) return data.neighborhoods
    return (data.regions ?? []).flatMap((region) =>
      (region.neighborhoods ?? []).map((neighborhood) => ({
        ...neighborhood,
        region: { id: region.id, name: region.name },
      })),
    )
  }

  async resolveAddress(
    latitude: number,
    longitude: number,
    signal?: AbortSignal,
  ): Promise<AddressResolutionDto> {
    const { data } = await api.get<AddressResolutionDto>('/addressing/resolve/', {
      params: { latitude, longitude },
      signal,
    })
    return data
  }
}
