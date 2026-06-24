import api from '@/plugins/axios'
import type { FloodPointsApiResponse } from '@/types/floodPoints'
import type { Paginated } from '@/types/general/pagination'
import type { PredictionApiItem } from '@/types/predictions'

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
  async getMachineLearningPredictions(): Promise<Paginated<PredictionApiItem>> {
    const { data } = await api.get<Paginated<PredictionApiItem>>(`/forecast/foresee`)

    console.log('Received machine learning predictions data:', data)

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
