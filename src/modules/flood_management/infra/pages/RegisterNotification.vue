<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNavigation } from '@/@core/composables/navigation'
import { ProfileForm } from '@/@core/components'
import { SelectFloodAlert } from '../components'
import type { IFormField } from '@/@core/interfaces/form'
import { showNotification } from '@/main'

const location = ref({
    neighborhood: null as string | null,
    city: null as string | null,
    data: [
        { name: 'Temperatura', icon: '/weather_information/cloud.svg', scale: 23 },
        {
            name: 'Probabilidade de enchente',
            icon: '/weather_information/danger.svg',
            scale: 59,
            message: 'NORMALIDADE!',
        },
        { name: 'Vazão do rio', icon: '/weather_information/river_discharge.svg', scale: 46 },
    ] as const,
    date: 'Seg, 22:00',
})

const fields: IFormField[] = [
    {
        id: 'neighborhood',
        label: 'Bairro',
        placeholder: 'Digite o bairro aqui',
        type: 'text',
        autocomplete: 'neighborhood',
    },
    {
        id: 'city',
        label: 'Cidade',
        placeholder: 'Digite a cidade aqui',
        type: 'text',
        autocomplete: 'city',
    },
    {
        id: 'description',
        label: 'Descrição',
        placeholder: 'Escreva a descrição da notificação',
        type: 'text',
        autocomplete: 'description',
    },
]

const ALERTS: AlertInfo[] = [
    {
        id: 0,
        title: 'CRISE!',
        description: 'Probabilidade muito alta de alagamento.',
        bgClass: 'bg-[#6326CC] text-white',
    },
    {
        id: 1,
        title: 'ALERTA!',
        description: 'Probabilidade alta de alagamento.',
        bgClass: 'bg-[#FF0A0A] text-white',
    },
    {
        id: 2,
        title: 'ATENÇÃO!',
        description: 'Probabilidade moderada de alagamento.',
        bgClass: 'bg-[#F87400] text-black',
    },
    {
        id: 3,
        title: 'MOBILIZAÇÃO!',
        description: 'Probabilidade baixa de alagamento.',
        bgClass: 'bg-[#FFE101] text-black',
    },
    {
        id: 4,
        title: 'NORMALIDADE!',
        description: 'Probabilidade muito baixa de alagamento.',
        bgClass: 'bg-[#00D42E] text-black',
    },
]

const selectedAlertInfo = computed(
    () => ALERTS.find((a) => a.title === location.value.data[1].message) ?? ALERTS[4],
)

async function requestPermissionAndNotify(values: Record<string, any>) {
    const title = selectedAlertInfo.value.title
    const body =
        (typeof values.description === 'string' && values.description.trim()) ||
        selectedAlertInfo.value.description

    const doNotify = () => {
        // Notificação local (toast + system)
        showNotification(title, body)

        // Broadcast para outros clientes via Firestore (se definido em main.ts)
        if (window.sendNotification) {
            window.sendNotification(`${title}: ${body}`)
        }
    }

    if (Notification.permission === 'granted') {
        doNotify()
        return
    }

    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
            doNotify()
        }
        return
    }
}

const { routerBack } = useNavigation()
</script>

<template>
    <div
        class="lg:fixed lg:inset-0 lg:z-20 lg:flex lg:items-center lg:justify-center lg:bg-black/80"
    ></div>
    <div
        class="lg:fixed lg:inset-0 lg:z-20 lg:flex lg:items-center lg:justify-center lg:bg-black/80"
    >
        <div
            class="lg:flex lg:max-h-[90vh] lg:w-[90%] lg:max-w-md lg:flex-col lg:overflow-y-auto lg:rounded-lg lg:bg-white lg:pt-4 lg:pb-7 lg:shadow-lg lg:dark:bg-[#000d19]"
        >
            <div class="lg:flex lg:justify-between lg:px-5">
                <button
                    class="hidden lg:block lg:text-2xl lg:text-gray-500 lg:hover:text-gray-700 lg:dark:hover:text-gray-300"
                    @click="routerBack"
                >
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
            </div>

            <div class="lg:flex lg:flex-col lg:items-center lg:gap-4 lg:p-5 lg:pt-0">
                <h1 class="mb-5 hidden text-center text-2xl font-semibold lg:block">
                    Registrar notificação
                </h1>
                <div class="grid gap-2">
                    <p class="text-sm">Situação</p>
                    <SelectFloodAlert v-model:alert="location.data[1].message" />
                </div>
                <ProfileForm
                    :formFields="fields"
                    buttonText="Cadastrar"
                    @submit="requestPermissionAndNotify"
                />
            </div>
        </div>
    </div>
</template>
