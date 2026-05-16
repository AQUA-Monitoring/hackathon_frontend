export interface IFlood {
  id: string
  descricao?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  neighborhood: string
  probability: number
  duration: number
  props: any
}

export interface IFloodListItem {
  id: string | number
  neighborhood: string
  duration: number
  createdAt?: string
  probability: number
}
