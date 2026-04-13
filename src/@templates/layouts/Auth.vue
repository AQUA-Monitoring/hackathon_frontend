<script setup lang="ts">
import { HeaderComp, MobileMenu } from '@/@core/components'
</script>

<template>
    <div class="relative h-screen overflow-hidden">
        <div class="lg:hidden">
            <HeaderComp :title="String($route.name)" />
        </div>
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
                    class="grid px-5 pb-20 sm:px-10 md:px-15 lg:px-20 xl:px-25"
                />
            </Transition>
        </RouterView>

        <div
            class="absolute inset-0 -bottom-150 -z-10 bg-cover bg-center lg:hidden"
            style="background-image: url('/layouts/wavesMobile.svg')"
            aria-hidden="true"
        ></div>
        <MobileMenu class="fixed bottom-0 lg:hidden" />
    </div>
</template>
