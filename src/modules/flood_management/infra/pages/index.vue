<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import type { IChart } from '@/@core/interfaces/chart'
import { useGeolocationStore } from '@/@core/plugins/registered/pinia/geolocation'
import { BaseChart, ProfileForm } from '@/@core/components'
import type { IFormField, INotificationOption } from '@/@core/interfaces/form'
import { useFloodCameraMonitoringController } from '@/modules/flood_camera_monitoring/controller/FloodCameraMonitoringController'
import { useFloodController } from '@/modules/flood_management/controllers/FloodController'
import {
    HlsStreamPlayer,
    EmbedStreamPlayer,
} from '@/modules/flood_camera_monitoring/infra/components'
import { Mapbox, SelectFloodAlert, FloodPoints } from '../components'

type ViewMode = 'embed' | 'hls'

const geolocation = useGeolocationStore()
const ctrl = useFloodCameraMonitoringController()
const cams = computed(() => ctrl.camerasWithPrediction)
const { state } = useFloodController()

const menu = {
    id: 'menu',
    options: [
        {
            id: 0,
            label: 'Cadastre um novo ponto de alagamento',
            icon: 'add',
            link: '/admin/mapa-de-alagamento',
        },
        { id: 1, label: 'Gráficos', icon: 'bar_chart_4_bars', link: '/admin/graficos' },
        {
            id: 2,
            label: 'Cadastrar ocorrência',
            icon: 'report',
            link: '/admin/registrar-ocorrencia',
        },
        { id: 3, label: 'Histórico de cadastros', icon: 'schedule', link: '/admin/historico' },
        {
            id: 4,
            label: 'Emitir Notificação',
            icon: 'notifications_active',
            link: '/admin/registrar-notificacao',
        },
    ],
}
const data: IChart = {
    id: 'charts',
    options: {
        labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'],
        datasets: [
            {
                label: 'Índices de alagamentos',
                data: [12, 19, 3, 5, 2],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    },
}
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
const historyNotifications: IFormField<INotificationOption>[] = [
    {
        id: 'notification',
        label: 'Notificações',
        type: 'select',
        options: [
            {
                id: 0,
                alert: 'CRISE!',
                message: 'Probabilidade muito alta de alagamento.',
                icon: '/icons/notification/crise.svg',
                neighborhood: 'Centro',
            },
            {
                id: 1,
                alert: 'ALERTA!',
                message: 'Probabilidade alta de alagamento.',
                icon: '/icons/notification/alerta.svg',
                neighborhood: 'Floresta',
            },
            {
                id: 2,
                alert: 'MOBILIZAÇÃO!',
                message: 'Probabilidade baixa de alagamento.',
                icon: '/icons/notification/mobilizacao.svg',
                neighborhood: 'Boa Vista',
            },
        ],
    },
]

const modes = reactive<Record<string, ViewMode>>({})
const orderedCams = computed(() => {
    return [...cams.value].sort((a, b) => {
        const aOnline = a.status === 'Online'
        const bOnline = b.status === 'Online'
        if (aOnline !== bOnline) return aOnline ? -1 : 1
        const aPct = displayFloodPercent(a as any)
        const bPct = displayFloodPercent(b as any)
        if (aPct !== bPct) return bPct - aPct
        return String(a.name || '').localeCompare(String(b.name || ''))
    })
})

function displayFloodPercent(cam: any): number {
    if (cam.prediction && typeof cam.prediction.probabilities?.flooded === 'number') {
        const v = cam.prediction.probabilities.flooded
        const clamped = Math.min(100, Math.max(0, v))
        return Number(clamped.toFixed(2))
    }
    return cam.flood_percentage
}
function handleNotification(values: Record<string, any>) {}

onMounted(async () => {
    await ctrl.load()
    const currentLocation = await geolocation.findNeighborhood()
    location.value.neighborhood = currentLocation.neighborhood
    location.value.city = currentLocation.city
    cams.value.forEach((c: any) => {
        modes[c.id] = 'hls'
    })

    watch(
        () => state.floods.length,
        () => {},
        { immediate: true },
    )
})
</script>

<template>
    <div class="hidden justify-center py-10 lg:block lg:flex">
        <nav class="mr-[2.083vw] w-20 rounded-xl bg-[#0453AF] text-white">
            <ul class="grid justify-center gap-7 px-5 py-10">
                <li v-for="item in menu.options" :key="item.id">
                    <RouterLink :to="item.link">
                        <span class="material-symbols-outlined">{{ item.icon }}</span>
                    </RouterLink>
                </li>
            </ul>
        </nav>

        <div>
            <h1 class="text-5xl font-semibold">Área de Administração</h1>
            <p class="mt-3 text-xl font-semibold text-[#0453AF]">Bem-vindo, !</p>

            <div class="grid grid-cols-2 items-center">
                <div class="h-[14vw] w-[30vw] rounded-2xl bg-[#F3F3F3] dark:bg-[#00182F]">
                    <Mapbox />
                </div>

                <div class="mx-[3.125vw] h-[18vw] w-[25vw]">
                    <h3 class="mb-3 font-semibold text-[#999999]">Altas probabilidades</h3>

                    <div
                        class="grid grid-cols-2 overflow-hidden rounded-2xl bg-[#F3F3F3] dark:bg-[#00182F]"
                    >
                        <div
                            v-for="(cam, index) in orderedCams.slice(0, 4)"
                            :key="cam.id"
                            class="relative h-[7vw] border border-white dark:border-[#000D19]"
                        >
                            <EmbedStreamPlayer
                                v-if="modes[cam.id] === 'embed' && cam.embed_url"
                                :src="cam.embed_url"
                                :title="cam.name"
                                class="h-full w-full"
                            />
                            <HlsStreamPlayer
                                v-else
                                :src="cam.hls_url"
                                :muted="true"
                                :controls="true"
                                :lock-to-live="true"
                                :live-delay="18"
                                class="h-full w-full"
                            />
                            <span
                                :class="[
                                    'absolute bottom-1 z-10 text-2xl font-extrabold',
                                    displayFloodPercent(cam) <= 40
                                        ? 'text-[#27CA2C]'
                                        : displayFloodPercent(cam) <= 70
                                          ? 'text-[#F87400]'
                                          : 'text-[#FF0A0A]',
                                    index % 2 == 0 ? 'right-3' : 'left-3',
                                ]"
                                >{{ displayFloodPercent(cam) }}%</span
                            >
                        </div>
                    </div>
                </div>

                <div
                    class="h-[14vw] w-[30vw] overflow-y-scroll rounded-2xl bg-[#F3F3F3] p-5 dark:bg-[#00182F]"
                >
                    <FloodPoints :points="state.floods" />
                </div>

                <div
                    class="mx-[3.125vw] h-[14vw] w-[25vw] rounded-2xl bg-[#F3F3F3] p-5 dark:bg-[#00182F]"
                >
                    <BaseChart :item="data" />
                </div>
            </div>
        </div>

        <div class="ml-[2.083vw]">
            <SelectFloodAlert v-model:alert="location.data[1].message" class="my-5" />

            <div class="rounded-2xl border border-[#2768CA] p-5">
                <h3 class="font-semibold text-[#999999]">Notificações frequentes</h3>

                <ProfileForm
                    :formFields="historyNotifications"
                    button-text="Reenviar"
                    @submit="handleNotification"
                />
            </div>
        </div>
    </div>

    <div class="grid justify-center gap-5 px-5 py-10 lg:hidden">
        <div>
            <h1 class="text-5xl font-semibold">Área de Administração</h1>
            <p class="mt-3 text-xl font-semibold text-[#0453AF]">Bem-vindo, !</p>
        </div>

        <nav class="text-white">
            <ul class="grid grid-cols-2 justify-center gap-7 py-5">
                <li
                    v-for="item in menu.options"
                    :key="item.id"
                    class="rounded-xl bg-[#0453AF] py-3 text-center transition-transform hover:scale-110"
                >
                    <RouterLink :to="item.link">
                        <span class="material-symbols-outlined">{{ item.icon }}</span>
                    </RouterLink>
                </li>
            </ul>
        </nav>

        <SelectFloodAlert v-model:alert="location.data[1].message" class="my-5" />

        <div class="min-h-[500px] w-full rounded-2xl">
            <Mapbox />
        </div>

        <div
            class="max-h-[40vw] w-full overflow-y-scroll rounded-2xl bg-[#F3F3F3] p-5 dark:bg-[#00182F]"
        >
            <FloodPoints :points="state.floods" />
        </div>

        <div class="h-[70vw] w-full">
            <h3 class="mb-3 font-semibold text-[#999999]">Altas probabilidades</h3>

            <div
                class="grid grid-cols-2 overflow-hidden rounded-2xl bg-[#F3F3F3] dark:bg-[#00182F]"
            >
                <div
                    v-for="(cam, index) in orderedCams.slice(0, 4)"
                    :key="cam.id"
                    class="relative h-[30vw] border border-white dark:border-[#000D19]"
                >
                    <EmbedStreamPlayer
                        v-if="modes[cam.id] === 'embed' && cam.embed_url"
                        :src="cam.embed_url"
                        :title="cam.name"
                        class="h-full w-full"
                    />
                    <HlsStreamPlayer
                        v-else
                        :src="cam.hls_url"
                        :muted="true"
                        :controls="true"
                        :lock-to-live="true"
                        :live-delay="18"
                        class="h-full w-full"
                    />
                    <span
                        :class="[
                            'absolute bottom-1 z-10 text-2xl font-extrabold',
                            displayFloodPercent(cam) <= 40
                                ? 'text-[#27CA2C]'
                                : displayFloodPercent(cam) <= 70
                                  ? 'text-[#F87400]'
                                  : 'text-[#FF0A0A]',
                            index % 2 == 0 ? 'right-3' : 'left-3',
                        ]"
                        >{{ displayFloodPercent(cam) }}%</span
                    >
                </div>
            </div>
        </div>

        <div class="max-h-[40vw] w-full rounded-2xl bg-[#F3F3F3] p-5 dark:bg-[#00182F]">
            <BaseChart :item="data.options[0]" />
        </div>

        <div class="rounded-2xl border border-[#2768CA] py-5">
            <h3 class="ml-5 font-semibold text-[#999999]">Notificações frequentes</h3>

            <ProfileForm
                :formFields="historyNotifications"
                button-text="Reenviar"
                @submit="handleNotification"
            />
        </div>
    </div>
</template>
