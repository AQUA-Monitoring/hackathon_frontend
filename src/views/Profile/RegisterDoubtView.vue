<script setup lang="ts">
import { BaseForm } from '@/components'
import type { IFormField } from '@/types/form'

const securityFields: IFormField[] = [
  {
    id: 'doubt',
    label: 'Qual a sua dúvida?',
    fields: [
      {
        placeholder: 'Selecione a categoria',
        type: 'select',
        autocomplete: 'doubt',
        options: ['opç 1', 'opç 2', 'opç 3'],
      },
    ],
  },
  {
    id: 'description',
    label: 'Descrição',
    fields: [
      {
        id: 'description',
        placeholder: 'Descreva a sua dúvida aqui',
        type: 'textarea',
        autocomplete: 'description',
      },
    ],
  },
  {
    id: 'send-file',
    label: 'Enviar arquivo',
    fields: [
      {
        id: 'file',
        type: 'file',
      },
    ],
  },
  {
    id: 'localization',
    label: 'Seu local',
    fields: [
      {
        id: 'state',
        label: 'Estado',
        type: 'select',
        options: ['Santa Catarina'],
      },
      {
        id: 'city',
        placeholder: 'Digite o nome da sua cidade',
        label: 'Cidade',
        type: 'text',
      },
      {
        id: 'neighborhood',
        placeholder: 'Digite o nome do seu bairro',
        label: 'Bairro',
        type: 'text',
      },
    ],
    buttonText: 'Confirmar',
  },
]
</script>

<template>
  <section class="mx-auto overflow-y-auto lg:p-10">
    <div class="grid gap-5 mb-10">
      <RouterLink
        to="/registrar-duvida"
        class="rounded-full text-center font-semibold px-3 py-2.5 min-w-62.5 cursor-pointer border border-[#2966C1] bg-[#2966C1] hover:bg-[#2966C1]/90 text-white"
        >Suporte</RouterLink
      >
      <RouterLink
        to="/seguranca"
        class="rounded-full text-center font-semibold px-3 py-2.5 min-w-62.5 cursor-pointer border border-[#2966C1] bg-transparent"
        >Segurança</RouterLink
      >
    </div>

    <h1 class="text-2xl font-semibold text-center">Registrar dúvida</h1>

    <BaseForm
      v-for="(section, index) in securityFields"
      :key="index"
      :form-fields="[section]"
      :button-text="section.buttonText"
    />
  </section>
</template>
