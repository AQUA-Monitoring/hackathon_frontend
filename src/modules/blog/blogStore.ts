import { ref } from 'vue'
import { defineStore } from 'pinia'
import BlogAPI from './blogApi'
import type { INotice } from './blogTypes'

export const useBlogStore = defineStore('blog', () => {
  const blogAPI = new BlogAPI()
  const blogs = ref<INotice[]>([])

  const getNewsBlog = async (): Promise<INotice[]> => {
    const data = await blogAPI.getNewsBlog()
    blogs.value = data.results
    return data.results
  }

  const getNewsById = async (id: string): Promise<INotice> => {
    const post = await blogAPI.getNewsById(id)
    const index = blogs.value.findIndex((item) => item.id === post.id)

    if (index >= 0) blogs.value[index] = post
    else blogs.value.push(post)

    return post
  }

  return {
    blogs,
    getNewsBlog,
    getNewsById,
  }
})
