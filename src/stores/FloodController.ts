import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { container } from 'tsyringe'

import { IFloodIAControllerState, type IFlood, type IFloodControllerState } from '@/types/flood'
import { FloodIARepository, FloodRepository } from '../repositories/FloodRepository'

export const useFloodController = defineStore('flood', () => {
  const floodRepository = container.resolve(FloodRepository)

  const state = reactive<IFloodControllerState>({
    floods: [],
    currentFlood: {},
    pagination: {
      page: 1,
      pageSize: 100,
      offset: 0,
      limit: 10,
    },
    loading: false,
    search: '',
  })

  const floods = computed(() => state.floods)
  const currentFlood = computed(() => state.currentFlood)
  const loading = computed(() => state.loading)

  const pagination = computed({
    get: () => state.pagination,
    set: (value) => (state.pagination = value),
  })

  const search = computed({
    get: () => state.search,
    set: (value) => (state.search = value),
  })

  const getFloods = async () => {
    try {
      state.loading = true
      const data = await floodRepository.getFloodPoints()
      const list = (data as any)?.results ?? data
      const mapped: IFlood[] = Array.isArray(list)
        ? list.map((p: any) => {
            const start = p.created_at ? new Date(p.created_at).getTime() : undefined
            const end = p.finished_at ? new Date(p.finished_at).getTime() : undefined
            const durationMin = start && end && end >= start ? Math.round((end - start) / 60000) : 0

            let finalProb: number = 0
            if (typeof p.possibility === 'number') {
              finalProb =
                p.possibility <= 1 ? Math.round(p.possibility * 100) : Math.round(p.possibility)
            } else if (typeof p.probability === 'number') {
              finalProb = p.probability
            }

            return {
              id: String(p.id ?? ''),
              neighborhood: p.neighborhood_name ?? p.neighborhood ?? '',
              probability: finalProb,
              duration: durationMin,
              props: p.props ?? null,
              descricao: p.descricao,
              createdAt: p.created_at,
              updatedAt: p.updated_at ?? p.finished_at,
              deletedAt: p.deleted_at,
            }
          })
        : []
      state.floods = mapped
      return data
    } catch (error) {
      throw error
    } finally {
      state.loading = false
    }
  }

  const getFloodById = async (id: string) => {
    state.loading = true
    const result = await floodRepository.getById(id)
    state.currentFlood = result
    state.loading = false
    return result
  }

  const clearCurrentFlood = () => {
    state.currentFlood = {}
  }

  const createFlood = async (flood: Partial<IFlood>) => {
    try {
      state.loading = true
      const data = await floodRepository.create(flood)
      await getFloods()
      return data
    } catch (error) {
      throw error
    } finally {
      state.loading = false
    }
  }

  const updateFlood = async (id: string, flood: Partial<IFlood>) => {
    try {
      state.loading = true
      const data = await floodRepository.update(id, flood)
      await getFloods()
      return data
    } catch (error) {
      throw error
    } finally {
      state.loading = false
    }
  }

  const deleteFlood = async (id: string) => {
    try {
      state.loading = true
      await floodRepository.delete(id)
      await getFloods()
    } catch (error) {
      throw error
    } finally {
      state.loading = false
    }
  }

  const registerFloodPoint = async (payload: Record<string, any>) => {
    try {
      state.loading = true
      const data = await floodRepository.registerFloodPoint(payload)
      return data
    } catch (error) {
      console.error('Error registering flood point:', error)
      throw error
    } finally {
      state.loading = false
    }
  }

  const getOccurrences = async () => {
    try {
      state.loading = true
      const data = await floodRepository.getFloodPoints()
      return data
    } catch (error) {
      throw error
    } finally {
      state.loading = false
    }
  }

  const registerOccurrences = async (payload: Record<string, any>) => {
    try {
      state.loading = true
      const data = await floodRepository.registerOccurrences(payload)
      return data
    } catch (error) {
      throw error
    } finally {
      state.loading = false
    }
  }

  return {
    state,
    floods,
    currentFlood,
    pagination,
    loading,
    search,
    getFloods,
    getFloodById,
    registerFloodPoint,
    clearCurrentFlood,
    createFlood,
    updateFlood,
    deleteFlood,
    getOccurrences,
    registerOccurrences,
  }
})

export const useFloodIAController = defineStore('floodIA', () => {
  const floodIARepository = container.resolve(FloodIARepository)

  const state = reactive<IFloodIAControllerState>({
    forecasts: [],
    currentForecast: {},
    pagination: {
      page: 1,
      pageSize: 100,
      offset: 0,
      limit: 10,
    },
    loading: false,
    search: '',
  })

  const forecasts = computed(() => state.forecasts)
  const currentForecast = computed(() => state.currentForecast)
  const loading = computed(() => state.loading)
  const pagination = computed(() => state.pagination)

  const search = computed({
    get: () => state.search,
    set: (value) => (state.search = value),
  })

  const getForecasts = async () => {
    state.loading = true
    const result = await floodIARepository.list()
    state.forecasts = result.results ?? result
    state.pagination = {
      ...state.pagination,
      page: result.page_number,
      pageSize: result.page_size,
    }
    state.loading = false
  }

  const getForecastById = async (id: string) => {
    state.loading = true
    const result = await floodIARepository.getById(id)
    state.currentForecast = result
    state.loading = false
  }

  const clearForecast = async () => {
    state.currentForecast = {}
  }

  return {
    state,
    forecasts,
    currentForecast,
    loading,
    pagination,
    search,
    getForecasts,
    getForecastById,
    clearForecast,
  }
})
