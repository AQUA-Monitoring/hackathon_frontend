<script setup lang="ts">
import 'reflect-metadata'

import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useInAppMessagingStore } from '@/@core/plugins/registered/pinia/inAppMessaging'
import { DownloadApp, InAppMessages, Loading } from '@/@core/components'

const notification = useInAppMessagingStore()
const { messages } = storeToRefs(notification)

onMounted(async () => {
    if (!sessionStorage.getItem('welcomeNotificationShown')) {
        const id = Date.now()
        notification.messages.push({ id, text: 'Bem-vindo(a) ao site! 🎉' })
        sessionStorage.setItem('welcomeNotificationShown', 'true')
        setTimeout(() => {
            notification.messages = notification.messages.filter((m) => m.id !== id)
        }, 7000)
    }
})
</script>

<template>
    <RouterView v-slot="{ Component }">
        <InAppMessages class="lg:hidden" />
        <DownloadApp v-if="messages.length > 0" @close="notification.messages = []" />
        <Loading />
        <Transition
            mode="out-in"
            enter-active-class="transition duration-300 ease-out"
            leave-active-class="transition duration-200 ease-in"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-4"
        >
            <component :is="Component" :key="$route.fullPath" />
        </Transition>
    </RouterView>
</template>
