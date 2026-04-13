<script setup lang="ts">
import { ProfileForm } from '@/@core/components'

const fields = [
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
        message: 'E-mail atual: qwertyzxc@gmail.com',
        placeholder: 'Digite seu email aqui',
        type: 'email',
        autocomplete: 'email',
        buttonText: 'Atualizar e-mail',
    },
    {
        id: 'dateborn',
        label: 'Atualizar data de nascimento',
        type: 'date',
        name: 'Mês',
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
        buttonText: 'Atualizar data',
    },
    {
        id: 'update-password',
        label: 'Atualizar senha',
        fields: [
            {
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
        placeholder: 'Digite sua senha aqui',
        type: 'password',
        autocomplete: 'new-password',
        buttonText: 'Excluir conta',
    },
]

function handleSecurity(values: Record<string, any>) {}
</script>

<template>
    <div class="-mt-30 grid justify-center px-5">
        <div class="grid justify-center lg:relative lg:-right-[25vw]">
            <h1 class="hidden text-center text-4xl font-semibold lg:block">Segurança</h1>
            <ProfileForm
                v-for="field in fields"
                :key="field.id"
                :form-fields="[field]"
                :buttonText="field.buttonText"
                @submit="handleSecurity"
            />
        </div>
    </div>
</template>
