<script setup lang="ts">
import { StepByStep, BaseForm, CodeInput } from '@/components'
import type { IFormField } from '@/types/form'
import { useScreenSize } from '@/composables/screenSize'

const { isDesktop } = useScreenSize()

const recoveryFields: IFormField[] = [
  {
    id: 'email',
    label: 'Email',
    fields: [
      {
        id: 'email',
        placeholder: 'Digite seu email aqui',
        type: 'email',
      },
    ],
  },
]
</script>

<template>
  <div
    v-if="isDesktop"
    class="fixed -z-10 h-screen inset-0 w-screen bg-contain bg-center bg-no-repeat transition-transform duration-1000 hidden lg:block translate-x-[-40%]"
    style="background-image: url('/layouts/wavesAuth.svg')"
  ></div>

  <section class="mx-10">
    <StepByStep :total-steps="2">
      <template #step-1>
        <p class="text-center">
          Essa conta está vinculada ao email nicfmello@gmail.com. Confirme o seu email no campo
          abaixo para receber um código de recuperação:
        </p>
        <BaseForm :form-fields="recoveryFields" />
      </template>

      <template #step-2>
        <p class="text-center">Insira o código enviado por email no campo abaixo:</p>
        <CodeInput />
      </template>
    </StepByStep>
  </section>
</template>
