import api from '@/app/plugins/axios'
import {
  adaptReferenceBaseStatus,
  adaptReferenceTerritories,
  adaptResolveReferenceArea,
} from '../addressingAdapter'
import type {
  ReferenceBaseStatus,
  ReferenceBaseStatusDto,
  ReferenceTerritoryCollection,
  ReferenceTerritoryFeatureCollectionDto,
  ResolveReferenceArea,
  ResolveReferenceAreaDto,
  ResolveReferenceAreaPayloadDto,
  TerritoryFeatureCollection,
} from '../types/addressing'

export default class AddressingApi {
  async getNeighborhoodTerritories(): Promise<TerritoryFeatureCollection> {
    const { data } = await api.get<TerritoryFeatureCollection>('/addressing/territories/', {
      params: { type: 'neighborhood' },
    })
    return data
  }

  async getRegionTerritories(): Promise<TerritoryFeatureCollection> {
    const { data } = await api.get<TerritoryFeatureCollection>('/addressing/territories/', {
      params: { type: 'region' },
    })
    return data
  }

  async getReferenceBaseStatus(): Promise<ReferenceBaseStatus> {
    const { data } = await api.get<ReferenceBaseStatusDto>('/addressing/v2/status/')
    return adaptReferenceBaseStatus(data)
  }

  async getReferenceTerritories(params?: {
    type?: 'city' | 'region' | 'neighborhood'
    referenceCityId?: string
  }): Promise<ReferenceTerritoryCollection> {
    const { data } = await api.get<ReferenceTerritoryFeatureCollectionDto>(
      '/addressing/v2/territories/',
      {
        params: {
          type: params?.type,
          reference_city_id: params?.referenceCityId,
        },
      },
    )
    return adaptReferenceTerritories(data)
  }

  async resolveReferenceArea(payload: ResolveReferenceAreaPayloadDto): Promise<ResolveReferenceArea> {
    const { data } = await api.post<ResolveReferenceAreaDto>(
      '/addressing/v2/resolve-area/',
      payload,
    )
    return adaptResolveReferenceArea(data)
  }
}
