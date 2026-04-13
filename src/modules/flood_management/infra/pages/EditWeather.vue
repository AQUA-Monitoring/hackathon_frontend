<script setup lang="ts">
import { ProfileForm } from '@/@core/components'
import type { IFormField } from '@/@core/interfaces/form'

const fields: IFormField[] = [
    {
        id: 'date',
        label: 'Data',
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
    },
    { id: 'latitude', label: 'Latitude', placeholder: 'Digite a latitude aqui', type: 'number' },
    { id: 'longitude', label: 'Longitude', placeholder: 'Digite a longitude aqui', type: 'number' },
    { id: 'city', label: 'Cidade', placeholder: 'Digite a cidade aqui', type: 'text' },
    { id: 'neighborhood', label: 'Bairro', placeholder: 'Digite o bairro aqui', type: 'text' },
    { id: 'rain', label: 'Chuva', placeholder: 'xxx', type: 'number' },
    { id: 'humidity', label: 'Umidade', placeholder: 'xxx', type: 'number' },
    { id: 'probability', label: 'Probabilidade', placeholder: 'xxx', type: 'number' },
    { id: 'duration', label: 'Duração', placeholder: 'xx', type: 'number' },
    { id: 'atmospheric_pressure', label: 'Pressão', placeholder: 'xxxxxx', type: 'number' },
    { id: 'river_discharge', label: 'Vazão do rio', placeholder: 'xxx', type: 'number' },
    { id: 'height', label: 'Altura', placeholder: 'xxx', type: 'number' },
]

function handleEditWeather(values: Record<string, any>) {}
</script>

<template>
    <div>
        <h1 class="text-center text-2xl font-semibold">Editar clima</h1>
        <ProfileForm :formFields="fields" buttonText="Cadastrar" @submit="handleEditWeather" />
    </div>
</template>
