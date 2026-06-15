import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { Paginated } from '@/types/general/pagination'

export type FloodPointGeometry = Polygon | MultiPolygon

export interface FloodPointApiFeature
  extends Feature<FloodPointGeometry, Record<string, unknown>> {
  id?: string
}

export interface FloodPointApiItem {
  id: number | string
  city: string
  city_name: string
  neighborhood: string
  neighborhood_name: string
  possibility: number
  created_at: string
  finished_at: string
  props: FloodPointApiFeature[]
}

export type FloodPointsApiResponse = Paginated<FloodPointApiItem>

export interface FloodPointMapFeatureProps {
  floodId: string
  featureId: string
  city: string
  neighborhood: string
  probability: number
  createdAt: string
  finishedAt: string
}

export type FloodPointMapFeature = Feature<FloodPointGeometry, FloodPointMapFeatureProps>

export type FloodPointFeatureCollection = FeatureCollection<
  FloodPointGeometry,
  FloodPointMapFeatureProps
>

export interface FloodPointUiItem {
  id: string
  city: string
  neighborhood: string
  probability: number
  createdAt: string
  finishedAt: string
  duration: number
}
