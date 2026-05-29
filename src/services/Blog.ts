import api from '@/plugins/axios'
import type { Data } from 'vue3-toastify'

export default class BlogAPI {
  async getNewsBlog() {
    const { data } = await api.get('/blog')

    return data
  }
  }



