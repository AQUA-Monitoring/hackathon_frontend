import type { IPaymentPix, IPaymentCard } from '../types/payment'
import api from '@/app/plugins/axios'

export default class PaymentAPI {
  async createPixPayment(payment: IPaymentPix) {
    const { data } = await api.post('/donate/pix/', payment)
    return data
  }

  async createCardPayment(payment: IPaymentCard) {
    const { data } = await api.post('donate/card', payment)
    return data
  }

  async getStatus(paymentId: string) {
    const { data } = await api.get(`/donate/status/${paymentId}`)
    return data
  }
}
