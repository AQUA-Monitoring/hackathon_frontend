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
        type: 'text',
        autocomplete: 'description',
      },
    ],
  },
  {
    id: 'update-password',
    label: 'Atualizar senha',
    fields: [
      {
        id: 'password',
        label: 'Senha atual',
        placeholder: 'Digite sua senha atual aqui',
        type: 'password',
        autocomplete: 'new-password',
      },
      {
        id: 'new-password',
        label: 'Nova senha',
        placeholder: 'Digite sua nova senha aqui',
        type: 'password',
        autocomplete: 'new-password',
      },
      {
        id: 'password-confirm',
        label: 'Confirme a sua senha',
        placeholder: 'Confirme a sua senha aqui',
        type: 'password',
        autocomplete: 'new-password',
      },
    ],
    buttonText: 'Atualizar senha',
  },
  {
    id: 'delete',
    label: 'Excluir conta',
    fields: [
      {
        id: 'password',
        placeholder: 'Digite sua senha aqui',
        type: 'password',
        autocomplete: 'new-password',
      },
    ],
    buttonText: 'Excluir conta',
  },
]
</script>

<template>
  <section class="mx-auto overflow-y-auto p-10">
    <h1 class="text-2xl font-semibold text-center">Registrar dúvida</h1>

    <BaseForm
      v-for="(section, index) in securityFields"
      :key="index"
      :form-fields="[section]"
      :button-text="section.buttonText"
    />
  </section>
</template>
