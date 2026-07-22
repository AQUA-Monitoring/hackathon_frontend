import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson'
import type { Paginated } from '@/shared'

export type FloodPointGeometry = Polygon | MultiPolygon

export interface FloodPointApiFeature extends Feature<FloodPointGeometry, Record<string, unknown>> {
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
  location?: Point | null
  footprint?: MultiPolygon | null
  primary_neighborhood?: FloodPointNeighborhoodDto | null
  neighborhoods?: FloodPointNeighborhoodDto[]
  reference_base_revision?: string | null
}

export interface FloodPointNeighborhoodDto {
  id: string
  name: string
  city_id: string
  region: {
    id: string
    name: string
  } | null
  is_primary: boolean
  relation: string
  intersection_area_m2: number | null
  footprint_fraction: number | null
  resolution_method: string
  review_status: 'automatic' | 'reviewed' | 'rejected'
}

export interface CreateFloodPointPayload {
  city: string
  neighborhood: string
  possibility: number
  duration: number
  finished_at: string
  props: FloodPointApiFeature[]
  location?: Point | null
  footprint?: MultiPolygon | null
  reference_base_revision?: string | null
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
  neighborhoodSummary: string
  primaryNeighborhood: FloodPointNeighborhood
  neighborhoods: FloodPointNeighborhood[]
  referenceBaseRevision: string | null
  probability: number
  createdAt: string
  finishedAt: string
  duration: number
}

export interface FloodPointNeighborhood {
  id: string
  name: string
  cityId: string
  relation: string | null
  isPrimary: boolean
  intersectionAreaM2: number | null
  footprintFraction: number | null
  resolutionMethod: string | null
  reviewStatus: 'automatic' | 'reviewed' | 'rejected' | null
  region: {
    id: string
    name: string
  } | null
}
