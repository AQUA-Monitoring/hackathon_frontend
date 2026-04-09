<script setup lang="ts">
const fields = [
    { start: '81%', end: '100%' },
    { start: '61%', end: '80%' },
    { start: '41%', end: '60%' },
    { start: '21%', end: '40%' },
    { start: '0%', end: '20%' },
]
</script>

<template>
    <div
        class="mt-10 flex justify-center gap-2 lg:pointer-events-none lg:absolute lg:bottom-8 lg:z-2 lg:mt-0 lg:flex lg:w-full lg:justify-between lg:gap-10 lg:px-15 lg:font-semibold"
    >
        <div
            class="px-5 text-center lg:pointer-events-auto lg:rounded-2xl lg:border lg:bg-[#7AA6C8]/30 lg:p-5 lg:shadow-xl lg:backdrop-blur-xs dark:border-[#00182F] lg:dark:border-transparent"
        >
            <h3 class="text-lg font-semibold">Legendas</h3>
            <p class="text-xs font-semibold">Probabilidade de alagamento</p>

            <div class="mt-5 flex gap-3">
                <div class="h-30 w-5 rounded-lg bg-gradient-to-b from-[#0047AB] to-[#00B2A9]"></div>
                <ul class="grid h-32 justify-between">
                    <li v-for="field in fields" :key="field.start" class="text-left text-xs">
                        {{ field.end }} - {{ field.start }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
