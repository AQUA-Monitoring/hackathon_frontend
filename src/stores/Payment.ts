import { defineStore } from "pinia";
import PaymentAPI from "@/services/Payment";
import type { IPaymentPix, IPaymentCard } from "@/types/payment";
import { ref } from "vue";

export const usePaymentStore = defineStore('payment', () => {
    const paymentApi = new PaymentAPI();

    const paymentCheckout = ref(null);

    const createPixPayment = async (payment: Partial<IPaymentPix>) => {
        const data = await paymentApi.createPixPayment(payment)
        console.log("data: ", data)
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
        createCardPayment
    }
})
