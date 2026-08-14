import api from '@/app/plugins/axios'
import type { Paginated } from '@/types/general/pagination'
import type { IMachineLearningPrediction } from '@/types/machine_learning'

export default class MachineLearningPredictions {
  async getMachineLearningPredictions(): Promise<Paginated<IMachineLearningPrediction>> {
    const { data } = await api.get<Paginated<IMachineLearningPrediction>>('/forecast/foresee/')

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
