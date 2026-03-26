<script setup lang="ts">
import { BaseForm } from '@/@core/components'
import type { IFormField } from '@/@core/interfaces/form'

const fields = [
    {
        id: 'category',
        label: 'Qual a sua dúvida?',
        name: 'Selecione a categoria',
        type: 'select',
        options: [
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro',
        ],
    },
    {
        id: 'description',
        label: 'Descrição',
        placeholder: 'Descreva a sua dúvida aqui',
        type: 'text',
        autocomplete: 'description',
    },
    {
        id: 'file',
        label: 'Enviar arquivo',
        type: 'file',
        autocomplete: 'file',
    },
    {
        id: 'state',
        label: 'Estado',
        name: 'Selecione o seu estado',
        type: 'select',
        options: [
            'Acre',
            'Alagoas',
            'Amapá',
            'Amazonas',
            'Bahia',
            'Ceará',
            'Distrito Federal',
            'Espírito Santo',
            'Goiás',
            'Maranhão',
            'Mato Grosso',
            'Mato Grosso do Sul',
            'Minas Gerais',
            'Pará',
            'Paraíba',
            'Paraná',
            'Pernambuco',
            'Piauí',
            'Rio de Janeiro',
            'Rio Grande do Norte',
            'Rio Grande do Sul',
            'Rondônia',
            'Roraima',
            'Santa Catarina',
            'São Paulo',
            'Sergipe',
            'Tocantins',
        ],
    },
    {
        id: 'city',
        label: 'Cidade',
        placeholder: 'Digite o nome da sua cidade',
        type: 'text',
        autocomplete: 'city',
    },
    {
        id: 'neighborhood',
        label: 'Bairro',
        placeholder: 'Digite o nome do seu bairro',
        type: 'text',
        autocomplete: 'neighborhood',
    },
]

function handleRegisterTicket(values: Record<string, any>) {}
</script>

<template>
    <div class="mb-10 grid justify-center px-5 pt-5 pb-10">
        <h1 class="hidden text-center text-2xl font-semibold lg:block">Registrar dúvida</h1>
        <BaseForm :form-fields="fields" @submit="handleRegisterTicket" />

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
