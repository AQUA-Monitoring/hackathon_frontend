import api from '@/plugins/axios'

export default class FloodPredictionsApi {
  async getAllFloodPredictions(page = 1, search = '') {
    const { data } = await api.get(`/flood_predictions/`, {
      params: { page, search },
    })

    return Array.isArray(data?.results) ? data.results : []
  }

  async refreshSync(): Promise<void> {
    await api.get(`/flood_predictions/`, {
      params: { refresh: 'sync' },
    })
  }
}
