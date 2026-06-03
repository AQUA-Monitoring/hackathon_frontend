export interface INotice {
  id: string
  banner_image: Image
  content_image: string | null
  title: string
  subject: string
  author: string
  content: string
  created_at: Date
  image: string
  category: string
}

interface Image {
  url: string
  description: string
  uploaded_on: Date
}
