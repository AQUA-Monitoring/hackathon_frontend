<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { BaseForm } from '@/components'
import type { IFormField } from '@/types/form'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.getMe()
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel carregar seus dados.')
    }
  }
})

const nameField = computed<IFormField>(() => ({
  id: 'name',
  label: 'Atualizar nome',
  fields: [
    {
      id: 'name',
      message: `Nome atual: ${authStore.user?.name ?? '-'}`,
      placeholder: 'Digite seu nome aqui',
      type: 'text',
      autocomplete: 'name',
    },
  ],
  buttonText: 'Atualizar nome',
}))

const emailField = computed<IFormField>(() => ({
  id: 'email',
  label: 'Email',
  fields: [
    {
      id: 'email',
      message: `E-mail atual: ${authStore.user?.email ?? '-'}`,
      placeholder: 'Seu email esta vinculado a conta',
      type: 'email',
      autocomplete: 'email',
    },
  ],
}))

const securityFields: IFormField[] = [
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

async function handleUpdateName(values: Record<string, any>) {
  if (!values.name) return
  try {
    await authStore.updateMe({ name: values.name })
    toast.success('Nome atualizado com sucesso.')
  } catch (error: any) {
    toast.error(error?.message || 'Nao foi possivel atualizar o nome.')
  }
}
</script>

<template>
  <section class="mx-auto lg:p-10">
    <div class="grid gap-5 mb-10">
      <RouterLink to="/suporte"
        class="rounded-full text-center font-semibold px-3 py-2.5 min-w-62.5 cursor-pointer border border-[#2966C1] bg-transparent">
        Suporte</RouterLink>
      <RouterLink to="/seguranca"
        class="rounded-full text-center font-semibold px-3 py-2.5 min-w-62.5 cursor-pointer border border-[#2966C1] bg-[#2966C1] hover:bg-[#2966C1]/90 text-white">
        Segurança</RouterLink>
    </div>

    <h1 class="text-2xl font-semibold text-center">Segurança</h1>

    <BaseForm
      :form-fields="[nameField]"
      :button-text="nameField.buttonText"
      :is-delete-button="nameField.isDeleteButton"
      @submit="handleUpdateName"
    />

    <BaseForm
      :form-fields="[emailField]"
      :button-text="emailField.buttonText"
      :is-delete-button="emailField.isDeleteButton"
    />

    <BaseForm
      v-for="(section, index) in securityFields"
      :key="index"
      :form-fields="[section]"
      :button-text="section.buttonText"
      :is-delete-button="section.isDeleteButton"
    />
  </section>
</template>
