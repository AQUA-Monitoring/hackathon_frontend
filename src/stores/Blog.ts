import { defineStore } from 'pinia'
import BlogAPI from '@/services/Blog'

export const useBlogStore = defineStore("blog", () => {
  const blogAPI = new BlogAPI();

  const getNewsBlog = async () => {
    try {
      const data = await blogAPI.getNewsBlog()
      return data
    } catch (error) {
      throw error
    }
  }
  return {
    getNewsBlog,
  }
})
