/** Envelope operacional temporário de Joinville e Araquari (WGS84). */
export type AquaCoordinate = [number, number]
export const AQUA_TERRITORY_BOUNDS: [AquaCoordinate, AquaCoordinate] = [
  [-49.05, -26.65],
  [-48.4, -25.85],
]
export const AQUA_TERRITORY_CENTER: AquaCoordinate = [-48.82, -26.25]
export const AQUA_TERRITORY_ZOOM = 10.5
export const AQUA_TERRITORY_BBOX: [number, number, number, number] = [
  AQUA_TERRITORY_BOUNDS[0][0],
  AQUA_TERRITORY_BOUNDS[0][1],
  AQUA_TERRITORY_BOUNDS[1][0],
  AQUA_TERRITORY_BOUNDS[1][1],
]

export function isInsideAquaTerritory([longitude, latitude]: AquaCoordinate) {
  return (
    longitude >= AQUA_TERRITORY_BOUNDS[0][0] &&
    longitude <= AQUA_TERRITORY_BOUNDS[1][0] &&
    latitude >= AQUA_TERRITORY_BOUNDS[0][1] &&
    latitude <= AQUA_TERRITORY_BOUNDS[1][1]
  )
}

export function clampAquaCoordinate([longitude, latitude]: AquaCoordinate): AquaCoordinate {
  return [
    Math.min(AQUA_TERRITORY_BOUNDS[1][0], Math.max(AQUA_TERRITORY_BOUNDS[0][0], longitude)),
    Math.min(AQUA_TERRITORY_BOUNDS[1][1], Math.max(AQUA_TERRITORY_BOUNDS[0][1], latitude)),
  ]
}
