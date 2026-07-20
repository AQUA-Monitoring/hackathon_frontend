export type CameraAdministrativeStatus = 'ACTIVE' | 'INACTIVE'
export type CameraStatus = CameraAdministrativeStatus | 'OFFLINE'
export type CameraLegacyStatus = CameraStatus | string
export type CameraStreamStatus = 'UNKNOWN' | 'CHECKING' | 'ONLINE' | 'UNAVAILABLE'
export type CameraAnalysisStatus =
  'NOT_ANALYZED' | 'RUNNING' | 'AVAILABLE' | 'STALE' | 'NO_FRAME' | 'MODEL_UNAVAILABLE' | 'ERROR'
export type CameraClassification = 'NO_INDICATION' | 'INTERMEDIATE_INDICATION' | 'FLOOD_INDICATION'

export interface CameraProbabilityDto {
  normal: number
  medium: number
  flooded: number
}

export interface CameraModelDto {
  status: string
  version: string | null
}

export interface CameraOperationalDto {
  stream: {
    status: CameraStreamStatus
    checked_at: string | null
  }
  analysis: {
    status: CameraAnalysisStatus
    classification: CameraClassification | null
    confidence: number | null
    probabilities: CameraProbabilityDto | null
    analyzed_at: string | null
    frames: number | null
    model: CameraModelDto | null
  }
}

export interface CameraTerritoryDto {
  id: string
  name: string
}

export interface CameraAddressDto {
  id: string
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

/**
 * Contrato aditivo da API de câmeras. Os campos territoriais no nível raiz
 * permanecem opcionais apenas para a migração de registros legados.
 */
export interface CameraApiItem {
  id: string
  description: string
  status: CameraLegacyStatus
  administrative_status: CameraAdministrativeStatus
  /** Disponíveis somente no detalhe; a listagem pública não expõe reprodução. */
  video_hls?: string | null
  preview_url?: string | null
  video_embed?: string | null
  address: CameraAddressDto | null
  operational: CameraOperationalDto
  neighborhood?: CameraTerritoryDto | null
  region?: CameraTerritoryDto | null
  latitude?: number | null
  longitude?: number | null
  created_at: string
  updated_at: string
}

export interface NearbyCameraItem extends CameraApiItem {
  distance_m: number
}

export interface NearbyCamerasResponse {
  count: number
  next: string | null
  previous: string | null
  ordering: 'distance'
  radius_m: number
  results: NearbyCameraItem[]
}

export interface CameraListFilters {
  search?: string
  region_id?: string
  neighborhood_id?: string
  administrative_status?: CameraAdministrativeStatus | ''
  stream_status?: CameraStreamStatus | ''
  analysis_status?: CameraAnalysisStatus | ''
  page?: number
}

export interface CityDto {
  id: string
  name: string
  state?: string
}

export interface NeighborhoodDto {
  id: string
  name: string
  city_id?: string | null
  region?: CameraTerritoryDto | null
}

export interface CameraCreatePayload {
  description: string
  video_hls: string
  video_embed: string | null
  address: {
    city_id: string
    neighborhood_id: string
    street: string
    number: string
    state: string
    country: string
    zipcode: string
    latitude: number
    longitude: number
    street_id?: string | null
    address_reference_id?: string | null
  }
}

/** Campos editáveis pelo operador na área administrativa. */
export interface CameraUpdatePayload {
  description?: string
  video_hls?: string
  video_embed?: string | null
  status?: CameraStatus
  address?: Partial<CameraCreatePayload['address']>
}

export type AddressAutocompleteKind = 'street' | 'address'

export interface AddressAutocompleteSuggestion {
  id: string
  kind: AddressAutocompleteKind
  label: string
  city_id: string
  neighborhood_id: string | null
  street_id: string | null
  address_reference_id: string | null
  street: string
  number: string | null
  zipcode: string | null
  city: CityDto | null
  neighborhood: NeighborhoodDto | null
  latitude: number | null
  longitude: number | null
}

export interface AddressAutocompleteFilters {
  kind: AddressAutocompleteKind
  q: string
  city_id?: string
  neighborhood_id?: string
  street_id?: string
}

export interface AddressResolutionDto {
  crs: 'EPSG:4326'
  city: CityDto | null
  neighborhood: NeighborhoodDto | null
  region: CameraTerritoryDto | null
  nearest_address: {
    id: string
    street: string
    number: string
    zipcode?: string
    /** Distância geodésica em metros calculada pelo catálogo canônico. */
    distance: number
    match_type: 'nearest' | string
    street_id?: string | null
    address_reference_id?: string | null
    neighborhood_id?: string | null
  } | null
}

// Contrato legado mantido para componentes territoriais ainda não migrados.
export interface ICamera {
  id: string
  name: string
  hls_url: string
  embed_url?: string
  flood_percentage: number | null
  status: string
  link: string
  latitude: number | null
  longitude: number | null
}

export type ViewMode = 'embed' | 'hls'
