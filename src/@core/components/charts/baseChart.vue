<script setup lang="ts">
import Chart from 'primevue/chart'
import type { ChartOptions } from 'chart.js'
import type { IChart } from '@/@core/types/chart'

const props = defineProps<{
    item: IChart
}>()

const chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
        legend: {
            labels: {
                color: '#495057',
            },
        },
    },
    scales: {
        x: {
            ticks: {
                color: '#495057',
            },
            grid: {
                color: '#ebedef',
            },
        },
        y: {
            ticks: {
                color: '#495057',
            },
            grid: {
                color: '#ebedef',
            },
        },
    },
}
</script>

<template>
    <div v-if="props.item?.options">
        <div class="grid rounded-2xl">
            <h3 class="mb-3 font-semibold text-[#999999]">
                {{ item.options.datasets[0]?.label }}
            </h3>
            <Chart type="bar" :data="item.options" :options="chartOptions" class="h-[10vw]" />
        </div>
    </div>
</template>
