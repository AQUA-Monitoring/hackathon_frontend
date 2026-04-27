<script setup lang="ts">
import { FooterComp, HeaderComp, MobileMenu } from '@/@core/components'
</script>

<template>
    <div>
        <HeaderComp :title="String($route.name)" />
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
                    class="grid px-5 pb-10 sm:px-10 md:px-15 lg:px-20"
                />
            </Transition>
        </RouterView>
        <MobileMenu :title="String($route.name)" class="fixed bottom-0 lg:hidden" />
        <FooterComp />
    </div>
</template>
