<script setup lang="ts">
import { HomeBannerGif } from '../../components'
import { isDesktop } from '@/@core/composables/screenSize'
</script>

<template>
    <section class="px-5 lg:-z-20 lg:flex lg:h-screen lg:items-center lg:justify-between">
        <div class="grid w-full gap-2 lg:w-[50%]">
            <h1
                class="gap-2 text-3xl font-semibold lg:mb-5 lg:grid lg:gap-5 lg:text-6xl xl:text-8xl"
            >
                Bem-vindo ao
                <span class="text-[#2768CA]">AQUA!</span>
            </h1>

            <p class="hidden text-xl font-semibold text-[#999999] lg:block xl:text-3xl">
                Acompanhe em tempo real áreas de risco, probabilidade de alagamentos e câmeras ao
                vivo. Informação <span class="text-[#2768CA]">rápida</span> e
                <span class="text-[#2768CA]">confiável</span> para sua segurança.
            </p>
            <p class="my-2 text-xl font-semibold text-[#999999] lg:hidden">
                Informação em tempo real.
            </p>

            <RouterLink
                to="/blog"
                :class="[
                    'mb-30',
                    isDesktop
                        ? 'mt-5 w-[250px] cursor-pointer rounded-lg bg-[#7AA6C8]/30 p-2 text-center font-semibold text-[#2768CA] shadow-xl backdrop-blur-xs lg:block lg:w-[300px] lg:p-3 lg:text-2xl'
                        : 'block w-[150px] cursor-pointer rounded-xl bg-blue-500 p-2 text-center font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600',
                ]"
            >
                Explorar
            </RouterLink>
        </div>

        <HomeBannerGif />
    </section>
</template>
