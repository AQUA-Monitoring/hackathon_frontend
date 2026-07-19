import api from '@/plugins/axios'
import type { TerritoryFeatureCollection } from '@/types/addressing'

export default class AddressingApi {
  async getNeighborhoodTerritories(): Promise<TerritoryFeatureCollection> {
    const { data } = await api.get<TerritoryFeatureCollection>('/addressing/territories/', {
      params: { type: 'neighborhood' },
    })
    return data
  }
}
