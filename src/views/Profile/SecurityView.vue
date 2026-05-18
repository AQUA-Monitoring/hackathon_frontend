<script setup lang="ts">
import { BaseForm } from '@/components'
import type { IFormField } from '@/types/form'

const securityFields: IFormField[] = [
  {
    id: 'name',
    label: 'Atualizar nome',
    fields: [
      {
        placeholder: 'Digite seu nome aqui',
        type: 'text',
        autocomplete: 'name',
      },
      {
        placeholder: 'Digite seu sobrenome aqui',
        type: 'text',
        autocomplete: 'name',
      },
    ],
    buttonText: 'Atualizar nome',
  },
  {
    id: 'email',
    label: 'Atualizar email',
    fields: [
      {
        id: 'email',
        message: 'E-mail atual: qwertyzxc@gmail.com',
        placeholder: 'Digite seu email aqui',
        type: 'email',
        autocomplete: 'email',
      },
    ],
    buttonText: 'Atualizar e-mail',
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
    isDeleteButton: true,
  },
]
</script>

<template>
  <section class="mx-auto overflow-y-auto p-10">
    <h1 class="text-2xl font-semibold text-center">Segurança</h1>

    <BaseForm
      v-for="(section, index) in securityFields"
      :key="index"
      :form-fields="[section]"
      :button-text="section.buttonText"
      :is-delete-button="section.isDeleteButton"
    />
  </section>
</template>
