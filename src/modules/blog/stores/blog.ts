import { ref } from 'vue'
import { defineStore } from 'pinia'
import BlogAPI from '../services/Blog'
import type { INotice } from '../types/blog'

export const useBlogStore = defineStore('blog', () => {
  const blogAPI = new BlogAPI()
  const blogs = ref<INotice[] | null>([])

  const getNewsBlog = async () => {
    try {
      const data = await blogAPI.getNewsBlog()
      blogs.value = data?.results
      return data?.results as INotice
    } catch (error) {
      throw error
    }
  }
  return {
    blogs,
    getNewsBlog,
  }
})
