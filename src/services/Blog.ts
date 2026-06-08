import api from '@/plugins/axios'

export default class BlogAPI {
  async getNewsBlog() {
    const { data } = await api.get('/blog')
    return data
  }
}