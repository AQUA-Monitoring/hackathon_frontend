<script setup lang="ts">
import { BaseForm } from '@/shared'
import type { FormValues, IFormField } from '@/shared'

const emit = defineEmits(['submit', 'toggle'])

defineProps<{
  recoveryFields: IFormField[]
}>()

const onSubmit = (values: FormValues) => {
  emit('submit', values)
  emit('toggle')
}
</script>

<template>
  <div class="lg:ml-auto lg:my-[25vh] lg:w-[35vw] px-10">
    <h1 class="font-semibold text-2xl text-center mb-5 hidden lg:block">Recuperação</h1>

    <p class="text-center mb-8">
      Essa conta está vinculada ao email nicfmello@gmail.com. Confirme o seu email no campo abaixo
      para receber um código de recuperação:
    </p>
    <div class="flex justify-center">
      <BaseForm :form-fields="recoveryFields" button-text="Continuar" @submit="onSubmit" />
    </div>
  </div>
</template>
