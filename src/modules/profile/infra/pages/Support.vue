<script setup lang="ts">
import { SelectField } from '@/@core/components'
import { SupportTicket } from '../components'
import type { IFormField } from '@/@core/interfaces/form'

const category: IFormField[] = {
    id: 'category',
    label: '',
    type: 'select',
    name: 'Categoria',
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
}

const status: IFormField[] = {
    id: 'status',
    label: '',
    type: 'select',
    name: 'Status',
    options: ['Pendente', 'Concluído'],
}

const tickets = [
    {
        code: '0123456789',
        interactions: {
            req: {
                user: {
                    picture: '/',
                    name: 'Nicole Ferreira Mello',
                },
                date: 'DD/MM/AAAA',
                category: 'Qwerty e Dvorak',
                status: 'Concluído',
                details:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                imgs: ['/icons/logo.svg', '/icons/logo.svg', '/icons/logo.svg'],
            },
            res: {
                user: {
                    picture: '/icons/logo.svg',
                    name: 'Suporte',
                },
                date: '12/08/2025',
                details:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                imgs: ['/icons/logo.svg', '', ''],
            },
        },
    },
    {
        code: '0123456789',
        interactions: {
            req: {
                user: {
                    picture: '/',
                    name: 'Nicole Ferreira Mello',
                },
                date: 'DD/MM/AAAA',
                category: 'Qwerty e Dvorak',
                status: 'Concluído',
                details:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                imgs: ['/icons/logo.svg', '', ''],
            },
            res: {
                user: {
                    picture: '/icons/logo.svg',
                    name: 'Suporte',
                },
                date: '12/08/2025',
                details:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                imgs: ['/icons/logo.svg', '', ''],
            },
        },
    },
    {
        code: '0123456789',
        interactions: {
            req: {
                user: {
                    picture: '/',
                    name: 'Nicole Ferreira Mello',
                },
                date: 'DD/MM/AAAA',
                category: 'Qwerty e Dvorak',
                status: 'Concluído',
                details:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                imgs: ['/icons/logo.svg', '', ''],
            },
            res: {
                user: {
                    picture: '/icons/logo.svg',
                    name: 'Suporte',
                },
                date: '12/08/2025',
                details:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                imgs: ['/icons/logo.svg', '', ''],
            },
        },
    },
]
</script>

<template>
    <div class="mb-10 grid justify-center px-5 pt-5 pb-10">
        <h1 class="mb-10 hidden text-center text-2xl font-semibold lg:block">Suporte</h1>
        <RouterLink
            to="/suporte/registro"
            class="mx-auto w-full rounded-2xl bg-blue-500 p-2 text-center text-sm font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600"
        >
            Precisa de Ajuda? Clique Aqui
        </RouterLink>

        <div class="my-7 flex items-center gap-2">
            <span class="material-symbols-outlined">tune</span>
            <p class="text-xs font-semibold">Filtrar atendimentos</p>
            <SelectField :field="category" />
            <SelectField :field="status" />
        </div>

        <SupportTicket v-for="(ticket, index) in tickets" :key="index" :ticket="ticket" />
        <button
            class="mx-auto mt-2 w-[250px] rounded-2xl bg-blue-500 p-2 font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600"
        >
            Ver mais
        </button>
    </div>
</template>
