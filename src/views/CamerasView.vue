<script setup lang="ts">
import CamerasGrid from '@/components/camera/camerasGrid.vue';
import { useCamerasMonitoring } from '@/composables/useCamerasMonitoring';

const { camerasWithPrediction } = useCamerasMonitoring();

</script>


<template>
  <div>
    <CamerasGrid :cameras="camerasWithPrediction" />
  </div>
</template>
