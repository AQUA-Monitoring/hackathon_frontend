import { ref } from 'vue'
import { defineStore } from 'pinia'
import PaymentAPI from '@/services/Payment'
import type { IPaymentCard, IPaymentPix } from '@/types/payment'

export const usePaymentStore = defineStore('payment', () => {
  const paymentApi = new PaymentAPI()

  const paymentCheckout = ref<IPaymentPix | IPaymentCard | null>(null)

  const createPixPayment = async (payment: Partial<IPaymentPix>) => {
    const data = await paymentApi.createPixPayment(payment)
    paymentCheckout.value = data
    return data
  }

  const createCardPayment = async (payment: Partial<IPaymentCard>) => {
    const data = await paymentApi.createCardPayment(payment)
    paymentCheckout.value = data
    return data
  }

  return {
    paymentCheckout,
    createPixPayment,
    createCardPayment,
  }
})
