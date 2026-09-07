import type { CameraApiItem, CameraStatus, NeighborhoodDto } from '../types/camera'

export function neighborhoodHasCanonicalRegion(neighborhood: NeighborhoodDto | null) {
  return Boolean(neighborhood?.region?.id)
}

export function cameraHasCanonicalRegion(camera: CameraApiItem) {
  return Boolean(camera.region?.id || camera.address?.region?.id)
}

export function cameraStatusOptionDisabled(camera: CameraApiItem, status: CameraStatus) {
  return (
    camera.status === 'INACTIVE' &&
    !cameraHasCanonicalRegion(camera) &&
    status !== 'INACTIVE'
  )
}

export function cameraTerritorialWarning(camera: CameraApiItem) {
  if (cameraHasCanonicalRegion(camera)) return null
  if (camera.status === 'INACTIVE') {
    return 'Esta câmera ainda não está vinculada a uma região da Base georreferenciada oficial. Ela poderá ser editada, mas não poderá ser ativada nem colocada offline até a regularização territorial.'
  }
  return 'Pendência territorial: esta câmera legada continua operacional, mas seus alertas não poderão ser confirmados enquanto não houver uma região ativa da Base georreferenciada oficial.'
}
