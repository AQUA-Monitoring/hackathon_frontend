<script setup lang="ts">
import { type PropType } from 'vue'
import type { IWeatherField } from '@/@core/types/weather'

defineProps({
    weatherStats: {
        type: Array as PropType<IWeatherField[]>,
        required: true,
    },
})
</script>

<template>
    <ul class="">
        <li v-for="data in weatherStats" class="flex w-23 items-center">
            <img :src="data.icon" :alt="data.name" />
            <div class="grid gap-1">
                <p class="text-center text-xs text-[#8F9192] dark:text-[#999999]">
                    {{ data.name }}
                </p>
                <p class="text-center text-xs font-semibold">{{ data.scale }}%</p>
            </div>
        </li>
    </ul>
</template>
