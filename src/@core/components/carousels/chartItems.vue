<script setup lang="ts">
import Chart from 'primevue/chart'
import type { ChartOptions } from 'chart.js'
import type { IChart } from '@/@core/interfaces/chart'

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
    <div class="my-10 grid rounded-2xl bg-[#E5E5E5] p-5 shadow-lg dark:bg-[#00182F]">
        <h3 class="mb-2 font-semibold">{{ item.options.datasets[0]?.label }}</h3>
        <Chart type="bar" :data="item.options" :options="chartOptions" />
    </div>
</template>
