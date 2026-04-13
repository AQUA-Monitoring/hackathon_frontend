import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { container } from 'tsyringe'

import type { IBlog } from '../interfaces/blog'
import { BlogRepository } from '../repositories/BlogRepository'

export interface IBlogControllerState {
    blogs: IBlog[]
    currentBlog: Partial<IBlog>
    pagination: {
        page: number
        pageSize: number
        offset: number
        limit: number
    }
    loading: boolean
    search: string
}

export const useBlogController = defineStore('blog', () => {
    const blogRepository = container.resolve(BlogRepository)

    const state = reactive<IBlogControllerState>({
        blogs: [],
        currentBlog: {},
        pagination: {
            page: 1,
            pageSize: 100,
            offset: 0,
            limit: 10,
        },
        loading: false,
        search: '',
    })

    const blogs = computed(() => state.blogs)
    const currentBlog = computed(() => state.currentBlog)
    const loading = computed(() => state.loading)

    const pagination = computed({
        get: () => state.pagination,
        set: (value) => (state.pagination = value),
    })

    const search = computed({
        get: () => state.search,
        set: (value) => (state.search = value),
    })

    const getBlogs = async () => {
        state.loading = true
        const result = await blogRepository.list()
        state.blogs = result.results
        state.pagination = {
            ...state.pagination,
            page: result.page_number,
            page_size: result.page_size,
            total: result.total,
            num_pages: result.num_pages,
        }
        state.loading = false
    }

    const getBlogById = async (id: string) => {
        state.loading = true
        const result = await blogRepository.getById(id)
        state.currentBlog = result
        state.loading = false
        return result
    }

    const clearCurrentBlog = () => {
        state.currentBlog = {}
    }

    const createBlog = async (blog: Partial<IBlog>) => {
        try {
            state.loading = true
            const data = await blogRepository.create(blog)
            await getBlogs()
            return data
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    const updateBlog = async (id: string, blog: Partial<IBlog>) => {
        try {
            state.loading = true
            const data = await blogRepository.update(id, blog)
            await getBlogs()
            return data
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    const deleteBlog = async (id: string) => {
        try {
            state.loading = true
            await blogRepository.delete(id)
            await getBlogs()
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    return {
        state,
        blogs,
        currentBlog,
        pagination,
        loading,
        search,
        getBlogs,
        getBlogById,
        clearCurrentBlog,
        createBlog,
        updateBlog,
        deleteBlog,
    }
})
