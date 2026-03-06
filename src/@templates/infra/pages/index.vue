<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FloodAlert, MapboxPopup } from '@/@core/components'
import { HomeBanner } from '../components'
import { Mapbox } from '../components'
import { useGeolocationStore } from '@/@core/plugins/registered/pinia/geolocation'

const showPopup = ref(false)
const togglePopup = () => (showPopup.value = !showPopup.value)
const geolocation = useGeolocationStore()

const location = ref({
    neighborhood: null as string | null,
    city: null as string | null,
    data: [
        { name: 'Temperatura', icon: '/weather_information/cloud.svg', scale: 23 },
        {
            name: 'Probabilidade de enchente',
            icon: '/weather_information/danger.svg',
            scale: 59,
            message: 'CRISE!',
        },
        { name: 'Vazão do rio', icon: '/weather_information/river_discharge.svg', scale: 46 },
    ] as const,
    date: 'Seg, 22:00',
})

onMounted(async () => {
    const currentLocation = await geolocation.findNeighborhood()
    location.value = {
        ...location.value,
        neighborhood: currentLocation?.neighborhood || 'Desconecido',
        city: currentLocation?.city || 'Desconhecida',
    }
})
</script>

<template>
    <div>
        <HomeBanner />
        <section id="content">
            <div
                class="flex cursor-pointer items-center justify-center py-5 lg:text-xl"
                @click="togglePopup"
            >
                <p class="font-semibold">
                    Localização: {{ location.neighborhood }}, {{ location.city }}
                </p>
                <span class="material-symbols-outlined pl-2 text-[#999999]">edit_square</span>
            </div>
            <MapboxPopup v-if="showPopup" @close="showPopup = false" />
            <FloodAlert :alert="location.data[1].message" />
            <Mapbox />
        </section>

        <section class="grid gap-5 lg:gap-10">
            <div
                class="grid items-center justify-center rounded-xl bg-[#F2F7F9] p-10 lg:flex lg:justify-between lg:px-20 dark:bg-[#00182F]"
            >
                <div class="text-center lg:w-[40%] lg:text-left">
                    <h2 class="text-3xl font-semibold">Fique informado!</h2>
                    <p class="my-5 font-semibold text-[#999999] lg:text-xl">
                        As enchentes estão cada vez mais presentes no nosso dia a dia. Aqui você
                        encontra informações simples e práticas para entender as causas, os impactos
                        e, principalmente, como se proteger. Acesse e fique por dentro.
                    </p>
                    <RouterLink
                        to="/blog"
                        class="block w-[250px] cursor-pointer rounded-lg bg-blue-500 p-2 text-center font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600 lg:text-lg"
                    >
                        Informe-se</RouterLink
                    >
                </div>
                <img src="/gifs/donation.gif" alt="Animação" class="hidden h-80 w-120 lg:block" />
            </div>

            <div
                class="grid items-center justify-center rounded-xl px-10 py-10 lg:flex lg:justify-between lg:px-20"
            >
                <img src="/gifs/blog.gif" alt="Animação" class="lg:h-80 lg:w-120" />

                <div class="text-center lg:w-[40%] lg:text-right">
                    <h2 class="text-3xl font-semibold">Ajude que precisa!</h2>
                    <p class="my-5 font-semibold text-[#999999] lg:text-xl">
                        As enchentes trazem desafios que muitas famílias não conseguem enfrentar
                        sozinhas. Sua doação ajuda a levar alimentos, abrigo e esperança para quem
                        mais precisa. Doe e faça parte dessa mudança..
                    </p>
                    <RouterLink
                        to="/pagamento"
                        class="ml-auto block w-[250px] cursor-pointer rounded-lg bg-blue-500 p-2 text-center text-lg font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600"
                    >
                        Doe agora</RouterLink
                    >

                    <img
                        src="/gifs/donation.gif"
                        alt="Animação"
                        class="lg:hidden lg:h-80 lg:w-120"
                    />
                </div>
            </div>
        </section>
    </div>
</template>
