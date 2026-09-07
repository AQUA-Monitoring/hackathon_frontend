export interface INotice {
  id: string
  banner_image: Image | null
  content_image: Image | null
  title: string
  subject: string
  author: string | null
  content: string | null
  reference_title: string
  reference_url: string
  created_at: string
}

interface Image {
  url: string
  description: string
  uploaded_on: string
}

export interface BlogListResponse {
  count: number
  next: string | null
  previous: string | null
  ordering: string | null
  results: INotice[]
}
