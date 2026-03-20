<script setup lang="ts">
import { CameraItems, ChartItems, MenuItems } from '.'

defineProps<{
    items: Object
}>()

const getComponent = (items) => {
    switch (items.id) {
        case 'menu':
            return MenuItems
        case 'charts':
            return ChartItems
        default:
            return CameraItems
    }
}
</script>

<template>
    <div id="carousel" class="mx-auto w-79 overflow-hidden lg:w-[50vw]">
        <ul class="flex space-x-5 overflow-x-auto pr-5">
            <li v-for="option in items.options" :key="option.icon">
                <component :is="getComponent(items)" :item="option" />
            </li>
        </ul>
    </div>
</template>
