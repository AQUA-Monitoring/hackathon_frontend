<script setup lang="ts">
import { CodeInput, ButtonGlassmorphism } from '@/components'

const emit = defineEmits(['submit'])

import type { FormValues } from '@/types/form'

const onSubmit = (values: FormValues) => {
  emit('submit', values)
}
</script>

<template>
  <div class="lg:mr-auto lg:my-[25vh] lg:w-[35vw] px-10">
    <h1 class="font-semibold text-2xl text-center mb-5 hidden lg:block">Código de recuperação</h1>

    <p class="text-center">Insira o código enviado por email no campo abaixo:</p>
    <CodeInput />
    <ButtonGlassmorphism button-text="Continuar" @click="onSubmit" />
  </div>
</template>
