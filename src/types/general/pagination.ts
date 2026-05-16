export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  ordering?: string | null
  results: T[]
}
