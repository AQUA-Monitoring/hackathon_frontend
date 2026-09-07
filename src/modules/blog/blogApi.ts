import api from '@/app/plugins/axios'
import type { BlogListResponse, INotice } from './blogTypes'

export default class BlogAPI {
  async getNewsBlog(): Promise<BlogListResponse> {
    const { data } = await api.get<BlogListResponse>('/blog/')
    return data
  }

  async getNewsById(id: string): Promise<INotice> {
    const { data } = await api.get<INotice>(`/blog/${encodeURIComponent(id)}/`)
    return data
  }
}
