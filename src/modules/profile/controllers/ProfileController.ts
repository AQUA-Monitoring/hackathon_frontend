import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { container } from 'tsyringe'

import type { IUser } from '../interfaces/user'
import { ProfileRepository } from '../repositories/ProfileRepository'

export interface IUserControllerState {
    profiles: IUser[]
    currentProfile: Partial<IUser>
    pagination: {
        page: number
        pageSize: number
        offset: number
        limit: number
    }
    loading: boolean
    search: string
}

export const useProfileController = defineStore('profile', () => {
    const profileRepository = container.resolve(ProfileRepository)

    const state = reactive<IUserControllerState>({
        profiles: [],
        currentProfile: {},
        pagination: {
            page: 1,
            pageSize: 100,
            offset: 0,
            limit: 10,
        },
        loading: false,
        search: '',
    })

    const profiles = computed(() => state.profiles)
    const currentProfile = computed(() => state.currentProfile)
    const loading = computed(() => state.loading)

    const pagination = computed({
        get: () => state.pagination,
        set: (value) => (state.pagination = value),
    })

    const search = computed({
        get: () => state.search,
        set: (value) => (state.search = value),
    })

    const getProfiles = async () => {
        state.loading = true
        const result = await profileRepository.list()
        state.profiles = result.results
        state.pagination = {
            ...state.pagination,
            page: result.page_number,
            page_size: result.page_size,
            total: result.total,
            num_pages: result.num_pages,
        }
        state.loading = false
    }

    const getProfileById = async (id: string) => {
        state.loading = true
        const result = await profileRepository.getById(id)
        state.currentProfile = result
        state.loading = false
        return result
    }

    const clearCurrentProfile = () => {
        state.currentProfile = {}
    }

    const createProfile = async (profile: Partial<IUser>) => {
        try {
            state.loading = true
            const data = await profileRepository.create(profile)
            await getProfiles()
            return data
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    const updateProfile = async (id: string, profile: Partial<IUser>) => {
        try {
            state.loading = true
            const data = await profileRepository.update(id, profile)
            await getProfiles()
            return data
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    const deleteProfile = async (id: string) => {
        try {
            state.loading = true
            await profileRepository.delete(id)
            await getProfiles()
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    return {
        state,
        profiles,
        currentProfile,
        pagination,
        loading,
        search,
        getProfiles,
        getProfileById,
        clearCurrentProfile,
        createProfile,
        updateProfile,
        deleteProfile,
    }
})
