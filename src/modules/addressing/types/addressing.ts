import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

export type TerritoryGeometry = Polygon | MultiPolygon

export interface TerritoryProperties {
  id: string
  name: string
  type: 'city' | 'region' | 'neighborhood'
  city: string | null
  city_id: string | null
  region_id: string | null
  source_record_id?: string
  provenance?: {
    dataset_id: string
    authority: string
    source_version: string
    source_url: string
    license: { name: string; url: string }
  } | null
}

export type TerritoryFeature = Feature<TerritoryGeometry, TerritoryProperties>
export type TerritoryFeatureCollection = FeatureCollection<
  TerritoryGeometry,
  TerritoryProperties
>

export type TerritoryCatalogSource = 'canonical' | 'local-fallback' | 'unavailable'
