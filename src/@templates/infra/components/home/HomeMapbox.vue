<script setup lang="ts">
import { ref } from 'vue'
import { MapboxPopup, FloodAlert } from '@/@core/components'
import { Mapbox } from '..'
import type { ILocation, IWeatherDetail } from '@/@core/types/location'

defineProps<{
    location: ILocation & { displayData: IWeatherDetail[] }
}>()

const showPopup = ref(false)
const togglePopup = () => {
    showPopup.value = !showPopup.value
}
</script>

<template>
    <section>
        <div
            class="flex cursor-pointer items-center justify-center pb-5 lg:text-xl"
            @click="togglePopup"
        >
            <p class="font-semibold">
                Localização: {{ location.neighborhood }}, {{ location.city }}
            </p>
            <span class="material-symbols-outlined pl-2 text-[#999999]">edit_square</span>
        </div>
        <MapboxPopup v-if="showPopup" @close="showPopup = false" />
        <FloodAlert :alert="location.displayData[0].message" />
        <Mapbox />
    </section>
</template>
