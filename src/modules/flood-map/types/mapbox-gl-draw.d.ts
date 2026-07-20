declare module '@mapbox/mapbox-gl-draw' {
  import type { Feature, FeatureCollection, Geometry } from 'geojson'

  interface DrawOptions {
    displayControlsDefault?: boolean
    defaultMode?: string
    controls?: Partial<Record<'point' | 'line_string' | 'polygon' | 'trash' | 'combine_features' | 'uncombine_features', boolean>>
  }

  export default class MapboxDraw {
    constructor(options?: DrawOptions)
    onAdd(map: unknown): HTMLElement
    onRemove(map: unknown): void
    add(feature: Feature | FeatureCollection | Geometry): string[]
    getAll(): FeatureCollection
    deleteAll(): this
    changeMode(mode: string, options?: Record<string, unknown>): this
    getMode(): string
    trash(): this
  }
}
