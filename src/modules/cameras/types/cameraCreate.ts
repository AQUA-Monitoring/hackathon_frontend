export interface CameraCreateFormState {
  city_id: string
  neighborhood_id: string
  street: string
  number: string
  state: string
  country: string
  zipcode: string
  latitude: number | null
  longitude: number | null
  description: string
  video_hls: string
  video_embed: string
  street_id: string | null
  address_reference_id: string | null
}

export interface MapCoordinates {
  latitude: number
  longitude: number
}

export type CameraCreateStep = 1 | 2 | 3 | 4
