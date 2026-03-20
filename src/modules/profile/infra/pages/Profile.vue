<script setup lang="ts">
import { ref } from 'vue'

const user = ref({
    picture: '/',
    name: 'Nicole Ferreira Mello',
    email: 'nicfmello@gmail.com',
    dateborn: '27/01/2009',
    created: '12/08/2025',
})
</script>

<template>
    <div class="grid justify-center lg:justify-end">
        <div
            class="relative -mt-15 h-[332%] flex-1 rounded-t-3xl bg-white p-5 text-center shadow-lg lg:right-[10vw] lg:h-full lg:bg-transparent lg:text-xl lg:shadow-none dark:bg-[#0f172a] lg:dark:bg-transparent"
        >
            <h1 class="hidden text-center text-4xl font-semibold lg:block">Perfil</h1>
            <div
                class="absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 overflow-hidden rounded-full border-4 border-white bg-[#d9d9d9] lg:relative lg:top-10 lg:h-35 lg:w-35 dark:border-[#0f172a]"
            >
                <img :src="user.picture" :alt="user.name" class="h-full w-full object-cover" />
            </div>

            <div class="mt-14">
                <h2 class="font-semibold">{{ user.name }}</h2>
                <p class="text-gray-500">{{ user.email }}</p>
            </div>
            <p class="mt-3">Data de Nascimento: {{ user.dateborn }}</p>
            <p>Data da Criação da Conta: {{ user.created }}</p>

            <button
                class="mx-auto mt-5 w-[250px] rounded-2xl bg-blue-500 p-2 font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600 lg:rounded-lg"
            >
                <RouterLink to="/seguranca" class="h-full w-full"> Editar informações </RouterLink>
            </button>
        </div>
    </div>
</template>
