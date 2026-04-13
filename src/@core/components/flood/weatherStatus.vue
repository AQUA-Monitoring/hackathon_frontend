<script setup lang="ts">
import { type PropType } from 'vue'
import type { IWeatherField } from '@/@core/interfaces/weather'

defineProps({
    weatherStatus: {
        type: Array as PropType<IWeatherField[]>,
        required: true,
    },
})
</script>

<template>
    <ul
        class="flex w-full items-center justify-between rounded-2xl bg-[#E5E5E5] p-5 shadow-lg lg:mx-auto lg:w-[50vw] lg:bg-transparent lg:px-10 dark:bg-[#00182F] dark:lg:bg-transparent"
    >
        <li v-for="data in weatherStatus" class="grid h-auto w-[50px] gap-1">
            <img :src="data.icon" :alt="data.name" class="mx-auto lg:h-20 lg:w-20" />
            <p class="text-center text-xs text-[#8F9192] lg:text-sm dark:text-[#999999]">
                {{ data.name }}
            </p>
            <p v-if="data.name == 'Temperatura'" class="text-center font-semibold">
                {{ data.scale }}°C
            </p>
            <p v-else-if="data.name == 'Vazão do rio'" class="text-center font-semibold">
                {{ data.scale }}mm
            </p>
            <p v-else class="text-center font-semibold">{{ data.scale }}%</p>
        </li>
    </ul>
</template>
