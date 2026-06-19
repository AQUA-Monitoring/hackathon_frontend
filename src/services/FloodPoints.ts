import api from '@/plugins/axios'
import type {
  CreateFloodPointPayload,
  FloodPointApiItem,
  FloodPointsApiResponse,
} from '@/types/floodPoints'

export default class FloodPointsApi {
  async getFloodPoints(page = 1): Promise<FloodPointsApiResponse> {
    const { data } = await api.get<FloodPointsApiResponse>('/floods_point/registering/', {
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

  async createFloodPoint(payload: CreateFloodPointPayload): Promise<FloodPointApiItem> {
    const { data } = await api.post<FloodPointApiItem>('/floods_point/registering/', payload)
    return data
  }

  async getFloodMachineLearningForecastPoints(page = 1): Promise<FloodPointsApiResponse> {
    const { data } = await api.get<FloodPointsApiResponse>('/forecast/foresee/', {
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
