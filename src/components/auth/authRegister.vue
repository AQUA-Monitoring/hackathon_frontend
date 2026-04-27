<script setup lang="ts">
import { BaseForm } from '@/components'
// import { GoogleAuthButton } from '../components'
import type { IFormField } from '@/types/form'

const emit = defineEmits(['submit', 'toggle'])

defineProps<{
  registerFields: IFormField[]
}>()

const onRegister = () => {
  emit('submit')
}

const onToggle = () => {
  emit('toggle')
}
</script>

<template>
  <div class="-mt-8 grid justify-between px-5 lg:mt-0 lg:flex lg:h-screen lg:px-[15vw]">
    <div class="my-auto hidden gap-5 text-center text-white lg:grid">
      <h3 class="text-4xl font-semibold">Bem-vindo!</h3>
      <p class="w-83 font-semibold">
        Que bom que você voltou. Faça o login e continue a aproveitando os benefícios do AQUA
      </p>
      <button
        @click="onToggle"
        class="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#7AA6C8]/30 px-10 py-2 font-semibold shadow-xl backdrop-blur-xs"
      >
        Entrar <span class="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>

    <div class="grid justify-center lg:my-auto">
      <h1 class="hidden text-center text-2xl font-semibold lg:block">Cadastro</h1>
      <BaseForm :form-fields="registerFields" button-text="Continuar" @submit="onRegister" />

      <p class="my-3 text-center font-semibold">ou</p>
      <!-- <GoogleAuthButton /> -->
      <button @click="onToggle" class="my-3 text-center text-xs lg:hidden">
        Você já tem conta? Faça o login
      </button>
    </div>
  </div>
</template>
