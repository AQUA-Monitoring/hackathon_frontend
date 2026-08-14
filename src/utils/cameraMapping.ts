import type {
  CameraDetail,
  CameraDetailDto,
  CameraFeatureCollection,
  CameraOperational,
  CameraProbabilityDto,
  CameraSummary,
  CameraSummaryDto,
  NearbyCamera,
  NearbyCameraDto,
} from '@/modules/cameras/types/camera'

const mapProbabilities = (
  probabilities: CameraProbabilityDto | null,
): CameraProbabilityDto | null => {
  if (probabilities === null) return null
  return {
    normal: probabilities.normal,
    medium: probabilities.medium,
    flooded: probabilities.flooded,
  }
}

const mapOperational = (dto: CameraSummaryDto['operational']): CameraOperational => ({
  streamStatus: dto.stream.status,
  streamCheckedAt: dto.stream.checked_at,
  analysisStatus: dto.analysis.status,
  classification: dto.analysis.classification,
  probabilities: mapProbabilities(dto.analysis.probabilities),
  confidence: dto.analysis.confidence,
  frames: dto.analysis.frames,
  analysisStartedAt: dto.analysis.started_at,
  analyzedAt: dto.analysis.analyzed_at,
  modelStatus: dto.analysis.model.status,
  modelVersion: dto.analysis.model.version,
  errorCode: dto.analysis.error_code,
  updatedAt: dto.updated_at,
})

const validCoordinate = (value: number | null, minimum: number, maximum: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : null

const cameraCoordinates = (dto: CameraSummaryDto) => ({
  latitude: validCoordinate(dto.address?.latitude ?? dto.latitude, -90, 90),
  longitude: validCoordinate(dto.address?.longitude ?? dto.longitude, -180, 180),
})

const floodPercentage = (dto: CameraSummaryDto): number | null => {
  const analysis = dto.operational.analysis
  if (analysis.status !== 'AVAILABLE' && analysis.status !== 'STALE') return null
  const flooded = analysis.probabilities?.flooded
  return typeof flooded === 'number' && Number.isFinite(flooded) ? flooded : null
}

export function mapCameraSummary(dto: CameraSummaryDto): CameraSummary {
  const coordinates = cameraCoordinates(dto)
  return {
    id: dto.id,
    name: dto.description,
    status: dto.status,
    administrativeStatus: dto.administrative_status,
    previewUrl: dto.preview_url,
    floodPercentage: floodPercentage(dto),
    operational: mapOperational(dto.operational),
    neighborhood: dto.address?.neighborhood ?? dto.neighborhood,
    region: dto.address?.region ?? dto.region,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    link: `/cameras/${dto.id}`,
  }
}

export function mapCameraDetail(dto: CameraDetailDto): CameraDetail {
  return {
    ...mapCameraSummary(dto),
    hlsUrl: dto.video_hls,
    embedUrl: dto.video_embed,
  }
}

export function mapNearbyCamera(dto: NearbyCameraDto): NearbyCamera {
  return {
    ...mapCameraSummary(dto),
    distanceM: dto.distance_m,
  }
}

export function camerasToGeoJson(cameras: CameraSummary[]): CameraFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: cameras.flatMap((camera) => {
      const { longitude, latitude } = camera
      if (longitude === null || latitude === null || (longitude === 0 && latitude === 0)) return []
      return [
        {
          type: 'Feature' as const,
          id: camera.id,
          geometry: { type: 'Point' as const, coordinates: [longitude, latitude] },
          properties: {
            id: camera.id,
            name: camera.name,
            status: camera.status,
            floodPercentage: camera.floodPercentage,
            analysisStatus: camera.operational.analysisStatus,
          },
        },
      ]
    }),
  }
}
