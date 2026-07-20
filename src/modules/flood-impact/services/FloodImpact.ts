import api from '@/app/plugins/axios'
import type {
  CreateFloodEventPayload,
  CreateFootprintRevisionPayload,
  FloodHotspot,
  FloodHotspotHistoryItem,
  FloodImpactFilters,
  FloodSpatialEvent,
  PaginatedResponse,
  RoadFloodImpact,
} from '../types/floodImpact'

function normalizePage<T>(data: PaginatedResponse<T> | T[]): PaginatedResponse<T> {
  const results = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : []
  return {
    count: Array.isArray(data) ? results.length : (data.count ?? results.length),
    next: Array.isArray(data) ? null : (data.next ?? null),
    previous: Array.isArray(data) ? null : (data.previous ?? null),
    results,
  }
}

async function collectPages<T>(request: (page: number) => Promise<PaginatedResponse<T> | T[]>) {
  const results: T[] = []
  let pageNumber = 1
  let page: PaginatedResponse<T>
  do {
    page = normalizePage(await request(pageNumber))
    results.push(...page.results)
    pageNumber += 1
  } while (page.next)
  return { count: results.length, next: null, previous: null, results } satisfies PaginatedResponse<T>
}

export default class FloodImpactApi {
  async getEvents(filters: FloodImpactFilters = {}) {
    return collectPages(async (page) => {
      const { data } = await api.get<PaginatedResponse<FloodSpatialEvent> | FloodSpatialEvent[]>(
        '/flood-impact/events/', { params: { ...filters, page } },
      )
      return data
    })
  }

  async createEvent(payload: CreateFloodEventPayload) {
    const { data } = await api.post<FloodSpatialEvent>('/flood-impact/events/', payload)
    return data
  }

  async createRevision(eventId: string, payload: CreateFootprintRevisionPayload) {
    const { data } = await api.post<FloodSpatialEvent>(
      `/flood-impact/events/${eventId}/revisions/`,
      payload,
    )
    return data
  }

  async activateEvent(eventId: string) {
    const { data } = await api.post<FloodSpatialEvent>(`/flood-impact/events/${eventId}/activate/`)
    return data
  }

  async revokeEvent(eventId: string) {
    const { data } = await api.post<FloodSpatialEvent>(`/flood-impact/events/${eventId}/revoke/`)
    return data
  }

  async recalculateEvent(eventId: string) {
    const { data } = await api.post<{ detail?: string; run_id?: string }>(
      `/flood-impact/events/${eventId}/recalculate/`,
    )
    return data
  }

  async getAffectedRoads(eventId: string, page = 1) {
    return collectPages(async (currentPage) => {
      const { data } = await api.get<PaginatedResponse<RoadFloodImpact> | RoadFloodImpact[]>(
        `/flood-impact/events/${eventId}/roads/`, { params: { page: currentPage || page } },
      )
      return data
    })
  }

  async getHotspots(filters: FloodImpactFilters = {}) {
    return collectPages(async (page) => {
      const { data } = await api.get<PaginatedResponse<FloodHotspot> | FloodHotspot[]>(
        '/flood-impact/hotspots/', { params: { ...filters, page } },
      )
      return data
    })
  }

  async getHotspotHistory(hotspotId: string, page = 1) {
    return collectPages(async (currentPage) => {
      const { data } = await api.get<PaginatedResponse<FloodHotspotHistoryItem> | FloodHotspotHistoryItem[]>(
        `/flood-impact/hotspots/${hotspotId}/history/`, { params: { page: currentPage || page } },
      )
      return data
    })
  }
}
