<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ alert: AlertKey }>()

type AlertKey = 'CRISE!' | 'ALERTA!' | 'ATENÇÃO!' | 'MOBILIZAÇÃO!' | 'NORMALIDADE!'

interface AlertInfo {
    id: number
    title: AlertKey
    description: string
    bgClass: string
    textClass?: string
}

const ALERTS: AlertInfo[] = [
    {
        id: 0,
        title: 'CRISE!',
        description: 'Probabilidade muito alta de alagamento.',
        bgClass: 'bg-[#6326CC] text-white',
    },
    {
        id: 1,
        title: 'ALERTA!',
        description: 'Probabilidade alta de alagamento.',
        bgClass: 'bg-[#FF0A0A] text-white',
    },
    {
        id: 2,
        title: 'ATENÇÃO!',
        description: 'Probabilidade moderada de alagamento.',
        bgClass: 'bg-[#F87400] text-black',
    },
    {
        id: 3,
        title: 'MOBILIZAÇÃO!',
        description: 'Probabilidade baixa de alagamento.',
        bgClass: 'bg-[#FFE101] text-black',
    },
    {
        id: 4,
        title: 'NORMALIDADE!',
        description: 'Probabilidade muito baixa de alagamento.',
        bgClass: 'bg-[#00D42E] text-black',
    },
]

const currentAlert = computed(() => ALERTS.find((a) => a.title === props.alert) ?? ALERTS[0])

const showAll = ref(false)
const toggle = () => (showAll.value = !showAll.value)
const otherAlerts = computed(() => ALERTS.filter((a) => a.title !== currentAlert.value.title))

const selected = ref<AlertInfo | null>(null)

const emit = defineEmits<{
    (e: 'update:alert', value: AlertInfo): void
}>()

const confirmSelection = () => {
    if (selected.value) {
        emit('update:alert', selected.value.title)
        showAll.value = false
    }
}
</script>

<template>
    <div
        class="relative mb-5 w-full rounded-2xl bg-white shadow-lg lg:bg-transparent dark:bg-[#000D19] lg:dark:bg-transparent"
    >
        <p
            class="relative grid cursor-pointer rounded-lg p-1 text-center text-sm lg:rounded-md"
            :class="currentAlert.bgClass"
            @click="toggle"
        >
            <span class="text-md font-semibold">{{ currentAlert.title }}</span>
            {{ currentAlert.description }}
            <span class="material-symbols-outlined absolute top-3 right-2"
                >keyboard_arrow_down</span
            >
        </p>

        <transition name="fade">
            <div
                v-if="showAll"
                class="absolute right-0 left-0 z-20 mt-3 grid gap-3 bg-white px-5 pb-3 dark:bg-[#000D19]"
            >
                <label v-for="alert in otherAlerts" :key="alert.id" class="cursor-pointer">
                    <input
                        type="radio"
                        name="alert"
                        :value="alert"
                        v-model="selected"
                        class="peer sr-only"
                    />
                    <p
                        class="grid rounded-lg p-1 text-center text-sm lg:rounded-md"
                        :class="alert.bgClass"
                    >
                        <span class="text-md font-semibold">{{ alert.title }}</span>
                        {{ alert.description }}
                    </p>
                </label>

                <div v-if="selected" class="pt-5">
                    <p class="mb-1 text-xs lg:text-sm">Nível selecionado:</p>
                    <p class="grid rounded-lg p-1 text-center text-sm" :class="selected.bgClass">
                        <span class="text-md font-semibold">{{ selected.title }}</span>
                        {{ selected.description }}
                    </p>

                    <div class="px-5">
                        <button
                            class="mx-auto mt-3 w-full rounded-lg bg-blue-500 p-2 font-semibold text-white shadow-xl"
                            @click="confirmSelection"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
