import type { Feature, FeatureCollection, MultiLineString, MultiPolygon, Point } from 'geojson'

export type FloodEvidenceKind =
  | 'FORECAST'
  | 'CAMERA_OBSERVATION'
  | 'USER_REPORT'
  | 'CONFIRMED_OCCURRENCE'

export type FloodEventStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'REVOKED'
export type FloodGeometryMethod = 'MANUAL' | 'PROVIDED' | 'DERIVED'
export type FloodImpactRelation = 'CROSSES' | 'WITHIN'
export type HotspotSpatialUnit = 'ROAD_SEGMENT' | 'GRID_CELL' | 'STREET' | 'NEIGHBORHOOD'

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface FloodSpatialEvent {
  id: string
  city: string
  city_name?: string
  neighborhoods: string[]
  evidence_kind: FloodEvidenceKind
  status: FloodEventStatus
  location: Feature<Point> | Point | null
  footprint: Feature<MultiPolygon> | MultiPolygon | null
  geometry_method: FloodGeometryMethod
  confidence: number | null
  valid_from: string
  valid_until: string | null
  source?: string | { type: string; id: string }
  metadata?: Record<string, unknown>
  current_revision?: number | null
  created_at?: string
  updated_at?: string
}

export interface CreateFloodEventPayload {
  city: string
  neighborhood_ids?: string[]
  evidence_kind: FloodEvidenceKind
  geometry_method: FloodGeometryMethod
  footprint: MultiPolygon
  confidence?: number | null
  valid_from: string
  valid_until?: string | null
  source?: string
  metadata?: Record<string, unknown>
}

export interface CreateFootprintRevisionPayload {
  footprint: MultiPolygon
  justification: string
  source_revision?: number | string | null
  valid_from?: string
  valid_until?: string | null
  geometry_method?: FloodGeometryMethod
  location?: Point | null
  confidence?: number | null
  source_version?: string
  properties?: Record<string, unknown>
}

export interface RoadFloodImpact {
  id: string
  road_axis_segment: string
  street_id?: string | null
  street_name?: string | null
  intersection: Feature<MultiLineString> | MultiLineString | null
  affected_length_m: number
  segment_fraction: number
  relation: FloodImpactRelation
  evidence_kind: FloodEvidenceKind
  evidence_status: FloodEventStatus
  dataset?: string
  revision?: number
  algorithm_version?: string
}

export interface NearbyCamera {
  id: string
  description: string
  latitude: number
  longitude: number
  distance_m?: number
  active?: boolean
}

export interface FloodHotspot {
  id: string
  spatial_unit: HotspotSpatialUnit
  spatial_id?: string | null
  grid_id?: string | null
  name?: string | null
  evidence_kind: FloodEvidenceKind
  period_start: string
  period_end: string
  event_count: number
  confirmed_event_count: number
  affected_length_m: number
  affected_duration_seconds: number
  recurrence_score: number
  geometry:
    | Feature<Point | MultiLineString | MultiPolygon>
    | Point
    | MultiLineString
    | MultiPolygon
    | null
  nearby_cameras?: NearbyCamera[]
  calculated_at?: string
  algorithm_version?: string
}

export interface FloodHotspotHistoryItem {
  id: string
  event_id: string
  evidence_kind: FloodEvidenceKind
  status: FloodEventStatus
  valid_from: string
  valid_until: string | null
  affected_length_m?: number
}

export interface FloodImpactFilters {
  city_id?: string
  evidence_kind?: FloodEvidenceKind | ''
  status?: FloodEventStatus | ''
  period_start?: string
  period_end?: string
  bbox?: string
  page?: number
}

export type ImpactLineCollection = FeatureCollection<
  MultiLineString,
  { id: string; street_name: string; evidence_kind: FloodEvidenceKind; relation: FloodImpactRelation }
>

export type HotspotCollection = FeatureCollection<
  Point | MultiLineString | MultiPolygon,
  { id: string; recurrence_score: number; confirmed_event_count: number; name: string }
>
