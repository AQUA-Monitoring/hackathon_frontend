import type { FeatureCollection, Point } from 'geojson'

export type CameraAdministrativeStatus = 'ACTIVE' | 'INACTIVE'
export type CameraStatus = CameraAdministrativeStatus | 'OFFLINE'
export type CameraStreamStatus = 'UNKNOWN' | 'CHECKING' | 'ONLINE' | 'UNAVAILABLE'
export type CameraAnalysisStatus =
  | 'NOT_ANALYZED'
  | 'RUNNING'
  | 'AVAILABLE'
  | 'STALE'
  | 'NO_FRAME'
  | 'MODEL_UNAVAILABLE'
  | 'ERROR'
export type CameraClassification =
  | 'NO_INDICATION'
  | 'INTERMEDIATE_INDICATION'
  | 'FLOOD_INDICATION'
export type CameraModelStatus = 'UNKNOWN' | 'READY' | 'UNAVAILABLE' | 'FALLBACK'

export interface CameraCatalogFilters {
  search?: string
  region_id?: string
  neighborhood_id?: string
  administrative_status?: CameraAdministrativeStatus
  stream_status?: CameraStreamStatus
  analysis_status?: CameraAnalysisStatus
  classification?: CameraClassification
  ordering?: string
}

export interface NearbyCamerasQuery {
  radius_m?: number
  page?: number
  page_size?: number
}

export interface CameraTerritoryDto {
  id: string
  name: string
}

export interface CameraProbabilityDto {
  normal: number
  medium: number
  flooded: number
}

export interface CameraOperationalDto {
  stream: {
    status: CameraStreamStatus
    checked_at: string | null
  }
  analysis: {
    status: CameraAnalysisStatus
    classification: CameraClassification | null
    probabilities: CameraProbabilityDto | null
    confidence: number | null
    frames: number | null
    started_at: string | null
    analyzed_at: string | null
    model: {
      status: CameraModelStatus
      version: string | null
    }
    error_code: string | null
  }
  updated_at: string | null
}

export interface CameraAddressDto {
  id: string
  street_id: string | null
  address_reference_id: string | null
  street: string
  number: string
  city: string
  city_ref: CameraTerritoryDto | null
  state: string
  country: string
  zipcode: string
  latitude: number | null
  longitude: number | null
  neighborhood: CameraTerritoryDto | null
  region: CameraTerritoryDto | null
}

export interface CameraTerritorialContextDto {
  city_id: string | null
  region_id: string | null
  neighborhood_id: string | null
  street_id: string | null
  road_segment_id: string | null
  address_reference_id: string | null
  resolution: Record<string, unknown>
}

interface CameraBaseDto {
  id: string
  description: string
  status: CameraStatus
  administrative_status: CameraAdministrativeStatus
  preview_url: string | null
  address: CameraAddressDto | null
  neighborhood: CameraTerritoryDto | null
  region: CameraTerritoryDto | null
  latitude: number | null
  longitude: number | null
  operational: CameraOperationalDto
  territorial_context: CameraTerritorialContextDto
  created_at: string
  updated_at: string
}

/** Contrato da listagem: não contém as URLs privadas de reprodução do detalhe. */
export type CameraSummaryDto = CameraBaseDto

/** Contrato do detalhe por UUID: fonte canônica para HLS e embed. */
export interface CameraDetailDto extends CameraBaseDto {
  video_hls: string | null
  video_embed: string | null
  created_by?: { id: string } | null
}

export interface NearbyCameraDto extends CameraBaseDto {
  distance_m: number
}

export interface CameraOperational {
  streamStatus: CameraStreamStatus
  streamCheckedAt: string | null
  analysisStatus: CameraAnalysisStatus
  classification: CameraClassification | null
  probabilities: CameraProbabilityDto | null
  confidence: number | null
  frames: number | null
  analysisStartedAt: string | null
  analyzedAt: string | null
  modelStatus: CameraModelStatus
  modelVersion: string | null
  errorCode: string | null
  updatedAt: string | null
}

export interface CameraSummary {
  id: string
  name: string
  status: CameraStatus
  administrativeStatus: CameraAdministrativeStatus
  previewUrl: string | null
  floodPercentage: number | null
  operational: CameraOperational
  neighborhood: CameraTerritoryDto | null
  region: CameraTerritoryDto | null
  latitude: number | null
  longitude: number | null
  link: string
}

export interface CameraDetail extends CameraSummary {
  hlsUrl: string | null
  embedUrl: string | null
}

export interface NearbyCamera extends CameraSummary {
  distanceM: number
}

export interface NearbyCamerasPage {
  count: number
  next: string | null
  previous: string | null
  ordering: 'distance'
  radiusM: number
  results: NearbyCamera[]
}

export interface CameraGeoJsonProperties {
  id: string
  name: string
  status: CameraStatus
  floodPercentage: number | null
  analysisStatus: CameraAnalysisStatus
}

export type CameraFeatureCollection = FeatureCollection<Point, CameraGeoJsonProperties>

// Compatibilidade nominal temporária para consumidores ainda não migrados.
export type CameraApiItem = CameraSummaryDto
export type ICamera = CameraSummary

export interface HlsOptions {
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  playsinline?: boolean
  poster?: string
  lockToLive?: boolean
  liveDelay?: number
  maxDelaySec?: number
}

export type ViewMode = 'embed' | 'hls'
