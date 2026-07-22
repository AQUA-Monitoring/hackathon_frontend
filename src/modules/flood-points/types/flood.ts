import type { FloodPointNeighborhood } from './floodPoints'

export interface IFlood {
  id: string
  descricao?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  neighborhood: string
  probability: number
  duration: number
  props: unknown
}

export interface IFloodListItem {
  id: string | number
  neighborhood: string
  neighborhoods: FloodPointNeighborhood[]
  referenceBaseRevision: string | null
  duration: number
  createdAt?: string
  probability: number
}
