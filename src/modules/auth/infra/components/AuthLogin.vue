<script setup lang="ts">
import { BaseForm } from '@/@core/components'
import { GoogleAuthButton } from '../components'
import type { IFormField } from '@/@core/interfaces/form'

const emit = defineEmits(['submit', 'toggle'])

defineProps<{
    loginFields: IFormField[]
}>()

const onLogin = () => {
    emit('submit')
}

const onToggle = () => {
    emit('toggle')
}
</script>

<template>
    <div class="mt-5 grid justify-between px-5 lg:mt-0 lg:flex lg:h-screen lg:px-[15vw]">
        <div class="my-auto grid justify-center">
            <h1 class="hidden text-center text-2xl font-semibold lg:block">Login</h1>
            <BaseForm :form-fields="loginFields" button-text="Entrar" @submit="onLogin" />

            <p class="my-3 text-center font-semibold">ou</p>
            <GoogleAuthButton />
            <button @click="onToggle" class="my-3 text-center text-xs lg:hidden">
                Você ainda não tem conta? Crie uma conta
            </button>
        </div>

        <div class="my-auto hidden gap-5 text-center text-white lg:grid">
            <h3 class="text-4xl font-semibold">Não tem conta?</h3>
            <p class="w-[332px] font-semibold">
                Faça o cadastro agora e <span>aproveite todos os benefícios do </span
                ><span>AQUA</span>
            </p>
            <button
                @click="onToggle"
                class="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#7AA6C8]/30 px-10 py-2 font-semibold shadow-xl backdrop-blur-xs"
            >
                Cadastre-se <span class="material-symbols-outlined">arrow_forward</span>
            </button>
        </div>
    </div>
</template>
