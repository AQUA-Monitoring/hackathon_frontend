<script setup lang="ts">
import { ref } from 'vue'
import { BaseForm, StepByStep, QrCode } from '@/components'
import type { IFormField } from '@/types/form'

const selected = ref<number | null>(null)

const payForms = [
  { icon: '/icons/payment/card.svg', name: 'Cartão' },
  { icon: '/icons/payment/pix.svg', name: 'Pix' },
  // { icon: '/payment/bank_slip.svg', name: 'Boleto' },
]

const paymentFields: IFormField[] = [
  {
    id: 'name',
    label: 'Nome do titular',
    fields: [
      {
        id: 'name',
        placeholder: ' Digite o nome do titular do cartão',
        type: 'text',
      },
    ],
  },
  {
    id: 'lastname',
    label: 'Sobrenome',
    fields: [
      {
        id: 'lastname',
        placeholder: ' Digite o sobrenome do titular do cartão',
        type: 'text',
      },
    ],
  },

  {
    id: 'documents',
    fields: [
      {
        type: 'group',
        fields: [
          {
            id: 'type_document',
            label: 'Tipo de documento',
            placeholder: 'CPF',
            type: 'number',
          },
          {
            id: 'number_document',
            label: 'Número do documento',
            placeholder: 'xxx.xxx.xxx-xx',
            type: 'number',
          },
        ],
      },
    ],
  },
]

const donationData = {
  name: 'Fulano Ciclano Beutrano',
  email: 'fulano.beutrano@gmail.com',
  cpf: '000.000.000.00',
  date: '00/00/0000',
  type: 'Pix',
  value: '20.00',
}
</script>

<template>
  <section class="p-10">
    <StepByStep :total-steps="5" finish-button-text="Pagar">
      <template #step-1>
        <h1 class="mb-20 text-center text-2xl font-semibold">Forma de pagamento</h1>

        <div class="grid justify-center">
          <div class="mb-10 grid w-83 gap-5 lg:flex lg:justify-center lg:gap-10">
            <label v-for="(form, index) in payForms" :key="index" class="cursor-pointer">
              <input
                type="radio"
                name="method"
                :value="index"
                v-model="selected"
                class="peer hidden"
              />
              <div
                class="lg:py-auto flex justify-center gap-5 rounded-2xl border-2 border-transparent p-3 py-5 text-center shadow-lg transition peer-checked:border-blue-600 lg:grid lg:h-40 lg:w-40 lg:gap-0 lg:px-0 lg:shadow-xl dark:bg-[#00182F]"
              >
                <img :src="form.icon" :alt="form.name" class="lg:mx-auto lg:my-auto" />
                <p>{{ form.name }}</p>
              </div>
            </label>
          </div>
        </div>
      </template>

      <template #step-2>
        <h1 class="mb-20 text-center text-2xl font-semibold">Pagamento com pix</h1>

        <BaseForm :form-fields="paymentFields" />
      </template>

      <template #step-3>
        <h1 class="mb-10 text-center text-2xl font-semibold">Dados da compra</h1>

        <ul class="w-125 grid gap-2">
          <li class="flex justify-between font-semibold">
            <p>Nome do titular:</p>
            <span class="text-[#999999]">{{ donationData.name }}</span>
          </li>
          <li class="flex justify-between font-semibold">
            <p>Email:</p>
            <span class="text-[#999999]">{{ donationData.email }}</span>
          </li>
          <li class="flex justify-between font-semibold">
            <p>CPF do rirular:</p>
            <span class="text-[#999999]">{{ donationData.cpf }}</span>
          </li>
          <li class="flex justify-between font-semibold">
            <p>Data de pagamento:</p>
            <span class="text-[#999999]">{{ donationData.date }}</span>
          </li>
          <li class="flex justify-between font-semibold">
            <p>Forma de pagamento:</p>
            <span class="text-[#999999]">{{ donationData.type }}</span>
          </li>
        </ul>

        <div
          class="flex justify-between items-center shadow-[0_8px_25px_rgba(0,0,0,0.40)] rounded-full px-5 my-10"
        >
          <div class="flex items-center">
            <img src="/icons/payment/donation.svg" alt="Doação" />
            <p class="font-bold">Doação</p>
          </div>

          <input
            type="number"
            placeholder="R$ 00.00"
            class="border border-[#7AA6C8] outline-none rounded-2xl px-3 py-1 w-30"
          />
        </div>
      </template>

      <template #step-4>
        <QrCode />
      </template>
    </StepByStep>
  </section>
</template>
