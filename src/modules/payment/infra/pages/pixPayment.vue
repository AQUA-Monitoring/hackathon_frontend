<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { loadMercadoPago } from '@mercadopago/sdk-js'
import { useRouter } from 'vue-router'
import { BaseForm, BasePopup } from '@/@core/components'
import { QrCode } from '../components'
import { usePixPayment } from '../../controllers/PaymentController'
import type { IFormField } from '@/@core/interfaces/form'

onMounted(async () => {
    await loadMercadoPago()
})

const router = useRouter()

const showPopupFinished = ref(false)
const closePopupFinished = () => {
    router.push('/')
}
const contentPopup = ref({
    title: '',
    message: '',
    gif: '',
})

const fieldsPix: IFormField[] = [
    {
        id: 'form-checkout__payerFirstName',
        name: 'payerFirstName',
        label: 'Nome do titular',
        placeholder: 'Digite o nome do titular aqui',
        type: 'text',
        autocomplete: 'name',
    },
    {
        id: 'form-checkout__payerLastName',
        name: 'payerLastName',
        label: 'Sobrenome',
        placeholder: 'Digite o sobrenome do titular aqui',
        type: 'text',
        autocomplete: 'last_name',
    },
    {
        id: 'form-checkout__email',
        name: 'email',
        label: 'Email',
        placeholder: 'Digite seu email aqui',
        type: 'email',
        autocomplete: 'email',
    },
    {
        id: 'form-checkout__identificationType',
        name: 'identificationType',
        label: 'Tipo de documento',
        placeholder: 'Informe o tipo de documento',
        type: 'text',
        autocomplete: 'cpf',
    },
    {
        id: 'form-checkout__identificationNumber',
        name: 'identificationNumber',
        label: 'Número do documento',
        placeholder: 'xxx.xxx.xxx.xx',
        type: 'number',
        autocomplete: 'document',
    },
    {
        id: 'transactionAmount',
        name: 'transactionAmount',
        label: 'Valor',
        placeholder: 'R$ x.xxx, xx',
        type: 'number',
        autocomplete: 'document',
    },
]

const pixStore = usePixPayment()
const showPopup = ref(false)
const pixUrl = ref('')
const qrBase64 = ref('')
const qrCode = ref('')

async function handlePixPayment(values: Record<string, any>) {
    try {
        const amount = parseFloat(values['transactionAmount'].replace(',', '.'))
        const response = await pixStore.createPaymentPix({
            payment_method_id: 'pix',
            first_name: values['form-checkout__payerFirstName'],
            last_name: values['form-checkout__payerLastName'],
            payer: {
                email: values['form-checkout__email'],
                identification: {
                    type: values['form-checkout__identificationType'],
                    number: values['form-checkout__identificationNumber'],
                },
            },
            transaction_amount: amount,
        })
        qrCode.value = response.point_of_interaction.transaction_data.qr_code
        qrBase64.value = response.point_of_interaction?.transaction_data?.qr_code_base64
        pixUrl.value = response?.point_of_interaction?.transaction_data?.pix_url
        showPopup.value = true
        const paymentId = response.id
        const interval = setInterval(async () => {
            const s = await pixStore.getStatus(paymentId)
            if (s.status === 'approved' || s.status === 'rejected') {
                clearInterval(interval)
                if (s.status === 'approved') {
                    contentPopup.value = {
                        title: 'Pagamento aprovado!',
                        message: 'Obrigado pela sua doação!',
                        gif: '/gifs/sucess.gif',
                    }
                    showPopupFinished.value = true
                    setTimeout(() => {
                        router.push('/')
                    }, 35000)
                } else {
                    contentPopup.value = {
                        title: 'Pagamento negado!',
                        message: 'Não foi possível realizar sua doação!',
                        gif: '/gifs/false.gif',
                    }
                    showPopupFinished.value = true
                    setTimeout(() => {
                        router.push('/')
                    }, 35000)
                }
            }
        }, 5000)
    } catch (error) {
        console.error('Erro ao criar pagamento Pix:', error)
        alert('Ocorreu um erro ao processar o pagamento. Tente novamente.')
    }
}

const closePopup = () => {
    showPopup.value = false
}
</script>

<template>
    <div class="grid justify-center pb-20">
        <h1 class="mb-2 hidden text-center text-2xl font-semibold lg:block">Doação</h1>
        <BaseForm :form-fields="fieldsPix" buttonText="Pagar com Pix" @submit="handlePixPayment" />
        <QrCode
            :showPopup="showPopup"
            :qrcode="`data:image/jpeg;base64,${qrBase64}`"
            :code="qrCode"
            @close="closePopup"
        />
        <BasePopup
            :title="contentPopup.title"
            :text="contentPopup.message"
            :gifUrl="contentPopup.gif"
            :showPopup="showPopupFinished"
            @close="closePopupFinished"
        />
    </div>
</template>
