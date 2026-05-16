<script setup lang="ts">
import CamerasGrid from '@/components/camera/camerasGrid.vue';
import { useCamerasMonitoring } from '@/composables/useCamerasMonitoring';

const { items } = useCamerasMonitoring();

</script>


<template>
  <div>
    <h1>Câmeras</h1>
    <CamerasGrid :cameras="items" />
  </div>
</template>
