<script setup lang="ts">
import type { IBlog } from '@/@core/interfaces/blog'

const blog: IBlog[] = [
    {
        id: 0,
        title: 'Fique informado!',
        description:
            'As enchentes estão cada vez mais presentes no nosso dia a dia. Aqui você encontra informações simples e práticas para entender as causas, os impactos e, principalmente, como se proteger. Acesse e fique por dentro.',
        link: { to: '/blog', label: 'Informe-se' },
        img: '/gifs/blog.gif',
    },
    {
        id: 1,
        title: 'Ajude quem precisa!',
        description:
            'As enchentes trazem desafios que muitas famílias não conseguem enfrentar sozinhas. Sua doação ajuda a levar alimentos, abrigo e esperança para quem mais precisa. Doe e faça parte dessa mudança..',
        link: { to: '/pagamento', label: 'Doe agora' },
        img: '/gifs/donation.gif',
    },
]
</script>

<template>
    <section class="grid gap-5 lg:gap-10">
        <div
            v-for="(notice, index) in blog"
            :key="index"
            :class="[
                'grid items-center justify-center rounded-xl p-10 lg:flex lg:justify-between lg:px-20',
                notice.id % 2 == 0 ? 'bg-[#F2F7F9] dark:bg-[#00182F]' : '',
            ]"
        >
            <img
                v-if="notice.id % 2 == 0"
                :src="notice.img"
                alt="Animação"
                class="hidden h-80 w-120 lg:block"
            />
            <div
                :class="[
                    'text-center lg:w-[40%]',
                    notice.id % 2 == 0 ? 'lg:text-left' : 'lg:text-right',
                ]"
            >
                <h2 class="text-3xl font-semibold">{{ notice.title }}</h2>
                <p class="my-5 font-semibold text-[#999999] lg:text-xl">{{ notice.description }}</p>
                <RouterLink
                    :to="notice.link.to"
                    class="mx-auto block w-[250px] cursor-pointer rounded-lg bg-blue-500 p-2 text-center font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600 lg:mx-0 lg:text-lg"
                    >{{ notice.link.label }}</RouterLink
                >
            </div>
            <img
                v-if="notice.id % 2 != 0"
                :src="notice.img"
                alt="Animação"
                class="hidden h-80 w-120 lg:block"
            />
        </div>
    </section>
</template>
