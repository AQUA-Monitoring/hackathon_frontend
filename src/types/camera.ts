export interface ICamera {
  id: string
  name: string
  hls_url: string
  embed_url?: string
  flood_percentage: number
  status: string
  link: string
  latitude: number
  longitude: number
}

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
