<script setup lang="ts">
import { ref } from 'vue'

const user = ref({
    picture: '/',
    name: 'nicolefemello',
})

const menubar = [
    { label: 'Perfil', link: '/minha-conta/nicolefemello' },
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Segurança', link: '/seguranca' },
    { label: 'Suporte', link: '/suporte' },
]
</script>

<template>
    <div class="grid justify-center px-5 pb-20">
        <div class="mx-auto my-7 h-20 w-20 overflow-hidden rounded-full bg-[#d9d9d9]">
            <img
                :src="user.picture"
                :alt="user.name"
                class="h-full w-full rounded-full object-cover transition-[filter] duration-300 ease-in-out"
            />
        </div>

        <p class="text-center">{{ user.name }}</p>

        <nav>
            <ul class="my-5 grid justify-center gap-5">
                <li
                    v-for="menu in menubar"
                    :key="menu.label"
                    class="rounded-xl px-25 py-5 text-center shadow-lg dark:bg-[#00182F]"
                >
                    <RouterLink :to="menu.link">{{ menu.label }}</RouterLink>
                </li>
            </ul>
        </nav>
    </div>
</template>
