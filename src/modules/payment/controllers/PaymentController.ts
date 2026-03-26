import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { container } from 'tsyringe'

import type { IPayment, IPaymentPix } from '../interfaces/payment'
import { PaymentPixRepository } from '../repositories/PaymentRepository'

export interface IPaymentControllerState {
    payments: IPayment[]
    currentPayment: Partial<IPayment>
    pagination: {
        page: number
        pageSize: number
        offset: number
        limit: number
    }
    loading: boolean
    search: string
    status?: string
}

export const usePaymentController = defineStore('payment', () => {
    const paymentRepository = container.resolve(PaymentPixRepository)

    const state = reactive<IPaymentControllerState>({
        payments: [],
        currentPayment: {},
        pagination: {
            page: 1,
            pageSize: 100,
            offset: 0,
            limit: 10,
        },
        loading: false,
        search: '',
        status: '',
    })

    const payments = computed(() => state.payments)
    const currentPayment = computed(() => state.currentPayment)
    const loading = computed(() => state.loading)

    const pagination = computed({
        get: () => state.pagination,
        set: (value) => (state.pagination = value),
    })

    const search = computed({
        get: () => state.search,
        set: (value) => (state.search = value),
    })

    const getPayments = async () => {
        state.loading = true
        const result = await paymentRepository.list()
        state.payments = result.results
        state.pagination = {
            ...state.pagination,
            page: result.page_number,
            page_size: result.page_size,
            total: result.total,
            num_pages: result.num_pages,
        }
        state.loading = false
    }

    const getPaymentById = async (id: string) => {
        state.loading = true
        const result = await paymentRepository.getById(id)
        state.currentPayment = result
        state.loading = false
        return result
    }

    const clearCurrentPayment = () => {
        state.currentPayment = {}
    }

    const createPayment = async (payment: Partial<IPayment>) => {
        try {
            state.loading = true
            const data = await paymentRepository.create(payment)
            await getPayments()
            return data
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    const updatePayment = async (id: string, payment: Partial<IPayment>) => {
        try {
            state.loading = true
            const data = await paymentRepository.update(id, payment)
            await getPayments()
            return data
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    const deletePayment = async (id: string) => {
        try {
            state.loading = true
            await paymentRepository.delete(id)
            await getPayments()
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    return {
        state,
        payments,
        currentPayment,
        pagination,
        loading,
        search,
        getPayments,
        getPaymentById,
        clearCurrentPayment,
        createPayment,
        updatePayment,
        deletePayment,
    }
})

export const usePixPayment = defineStore('pix', () => {
    const paymentPixRepository = container.resolve(PaymentPixRepository)

    const state = reactive<IPaymentControllerState>({
        payments: [],
        currentPayment: {},
        pagination: {
            page: 1,
            pageSize: 100,
            offset: 0,
            limit: 10,
        },
        loading: false,
        search: '',
    })

    const createPaymentPix = async (payment: Partial<IPaymentPix>) => {
        try {
            state.loading = true
            const data = await paymentPixRepository.create(payment)
            return data
        } catch (error) {
            throw error
        } finally {
            state.loading = false
        }
    }

    const getStatus = async (id: string) => {
        try {
            const result = await paymentPixRepository.getStatus(id)
            state.currentPayment = result
            return result
        } catch (error) {
            console.error('Erro ao buscar status de pagamento: ', error)
        }
    }

    return {
        state,
        createPaymentPix,
        getStatus,
    }
})
