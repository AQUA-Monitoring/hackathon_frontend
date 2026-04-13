<script setup lang="ts">
import { computed } from 'vue'
import { ALERTS } from '@/@core/interfaces/alert'

const props = defineProps<{
    alert: keyof typeof ALERTS
}>()

const alertInfo = computed(() => ALERTS[props.alert])
</script>

<template>
    <div class="my-5 grid gap-3">
        <p
            v-if="alertInfo"
            class="grid rounded-lg p-1 text-center text-sm"
            :class="alertInfo.bgClass"
        >
            <span class="text-md font-semibold">{{ props.alert }}</span>
            {{ alertInfo.description }}
        </p>
    </div>
</template>
