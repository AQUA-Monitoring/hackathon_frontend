<script setup lang="ts">
import { CameraItems, ChartItems } from '.'
import type { ICamera } from '@/@core/interfaces/camera'
import type { IChart } from '@/@core/interfaces/chart'

defineProps<{
    items: ICamera | IChart
}>()

const getComponent = (items: ICamera | IChart) => {
    switch (items.id) {
        case 'charts':
            return ChartItems
        default:
            return CameraItems
    }
}
</script>

<template>
    <div id="carousel" class="mx-auto w-79 overflow-hidden lg:w-[50vw]">
        <ul class="flex space-x-5 overflow-x-auto pr-5">
            <li v-for="option in items.options" :key="option.icon">
                <component :is="getComponent(items)" :item="option" />
            </li>
        </ul>
    </div>
</template>
