export interface IPayment {
    id: string
    descricao?: string
    createdAt?: string
    updatedAt?: string
    deletedAt?: string
}

export interface IPaymentPix {
    id: string
    total?: number
    payment_method_id?: string
    description?: string
    transaction_amount?: number
    first_name?: string
    last_name?: string
    payer?: {
        email?: string
        identification?: {
            number?: string
            type?: string
        }
    }

    point_of_interaction: {
        transaction_data: {
            qr_code: string
            qr_code_base64: string
            pix_url: string
        }
    }
}

export interface IPaymentCard {
    id: string
    token: string
    payment_method_id?: string
    description?: string
    installments?: string
    transaction_amount?: number
    issuer_id?: string
    amount?: number
    cardholder_email?: string
    identificationNumber?: number
    identificationType?: string
}