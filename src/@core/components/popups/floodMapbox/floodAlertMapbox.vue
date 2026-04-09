<script setup lang="ts">
import { computed } from 'vue'
import { ALERTS } from '@/@core/interfaces/alert'

const props = defineProps<{
    alert: keyof typeof ALERTS
}>()

const alertInfo = computed(() => ALERTS[props.alert])
</script>

<template>
    <p
        v-if="alertInfo"
        class="grid rounded-lg p-1 text-center text-[9px] text-white"
        :class="alertInfo.bgClass"
    >
        <span class="text-xs font-semibold">{{ props.alert }}</span>
        {{ alertInfo.description }}
    </p>
</template>
