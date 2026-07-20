import { ref } from 'vue'
import { defineStore } from 'pinia'
import BlogAPI from './blogApi'
import type { INotice } from './blogTypes'

export const useBlogStore = defineStore('blog', () => {
  const blogAPI = new BlogAPI()
  const blogs = ref<INotice[] | null>([])

  const getNewsBlog = async () => {
    const data = await blogAPI.getNewsBlog()
    blogs.value = data?.results
    return data?.results as INotice
  }
  return {
    blogs,
    getNewsBlog,
  }
})
