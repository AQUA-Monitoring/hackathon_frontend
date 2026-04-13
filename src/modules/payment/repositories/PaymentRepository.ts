import { injectable, inject } from 'tsyringe'
import { Api } from '@/@core/services/api'

import { BaseRepository } from '@/@templates/repositories/BaseRepository'
import { IPaymentPix } from '../interfaces/payment'

@injectable()
export class PaymentPixRepository extends BaseRepository<IPaymentPix> {
    constructor(@inject('ApiService') api: Api) {
        super(api, 'donate/pix/')
        this.api = api
    }
    async getStatus(paymentId: string) {
        const { data } = await this.api.get(`donate/status/${paymentId}`)
        return data
    }
}
