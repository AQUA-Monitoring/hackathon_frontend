<script setup lang="ts">
import { HeaderComp, MobileMenu } from '@/@core/components'

interface IMenuBar {
    label: string
    link: string
}

const menubar: IMenuBar[] = [
    { label: 'Perfil', link: '/minha-conta/nicolefemello' },
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Segurança', link: '/seguranca' },
    { label: 'Suporte', link: '/suporte' },
]
</script>

<template>
    <div>
        <div
            class="relative -z-15 mb-8 h-50 lg:z-0"
            :class="$route.name == 'Perfil' ? 'bg-[#A0C5E2] lg:bg-transparent' : 'bg-transparent'"
        >
            <img
                src="/layouts/wavesMobile.svg"
                alt="Ondas"
                v-if="$route.name == 'Perfil'"
                class="absolute inset-0 -z-10 h-full w-full object-cover lg:hidden"
            />
            <HeaderComp :title="String($route.name)" />
        </div>

        <div
            class="fixed inset-0 -z-10 hidden h-screen w-screen bg-cover bg-center lg:block"
            style="background-image: url('/layouts/wavesProfile.svg')"
            aria-hidden="true"
        ></div>

        <nav class="absolute top-30 left-10 hidden gap-5 lg:grid">
            <RouterLink
                v-for="menu in menubar"
                :key="menu.label"
                class="w-[250px] rounded-xl px-5 py-5 text-white shadow-lg"
                :to="menu.link"
            >
                {{ menu.label }}
            </RouterLink>
        </nav>

        <RouterView v-slot="{ Component }">
            <Transition
                mode="out-in"
                enter-active-class="transition duration-300 ease-out"
                leave-active-class="transition duration-200 ease-in"
                enter-from-class="opacity-0 translate-y-4"
                enter-to-class="opacity-100 translate-y-0"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-4"
            >
                <component
                    :is="Component"
                    :key="$route.fullPath"
                    class="grid px-5 pb-10 sm:px-10 md:px-15 lg:px-20 xl:px-25"
                />
            </Transition>
        </RouterView>
        <MobileMenu class="fixed bottom-0 lg:hidden" />
    </div>
</template>
