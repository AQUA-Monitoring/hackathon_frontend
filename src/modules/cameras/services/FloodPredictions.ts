import api from '@/app/plugins/axios'
import type { Paginated } from '@/types/general/pagination'
import type { PredictionApiItem } from '../types/predictions'

export default class FloodPredictionsApi {
  async getAllFloodPredictions(): Promise<Paginated<PredictionApiItem>> {
    const { data } = await api.get<Paginated<PredictionApiItem>>(`/flood_monitoring/predict/all/`)

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
