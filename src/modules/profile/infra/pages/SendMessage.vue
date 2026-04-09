<script setup lang="ts">
import { BaseForm } from '@/@core/components'

const fields = [
    {
        id: 'description',
        label: 'Texto da mensagem',
        placeholder: 'Descreva a sua mensagem aqui',
        type: 'text',
        autocomplete: 'description',
    },
    {
        id: 'file',
        label: 'Enviar arquivo',
        type: 'file',
        autocomplete: 'file',
    },
]

function handleSendMessage(values: Record<string, any>) {}
</script>

<template>
    <div class="mb-10 grid justify-center px-5 pt-5 pb-10">
        <h1 class="hidden text-center text-2xl font-semibold lg:block">Enviar mensagem</h1>
        <BaseForm :form-fields="fields" @submit="handleSendMessage" />

        <div class="flex gap-3">
            <button
                class="mx-auto mt-2 w-full rounded-lg border border-blue-500 px-2 py-1 font-semibold text-blue-500 shadow-xl"
            >
                Cancelar
            </button>
            <button
                class="mx-auto mt-2 w-full rounded-lg bg-blue-500 px-2 py-1 font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600"
            >
                Confirmar
            </button>
        </div>
    </div>
</template>
