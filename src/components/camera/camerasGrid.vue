<script setup lang="ts">
import type { ICamera } from '@/types/camera';
import { HlsPlayer } from '@/components';

const props = defineProps<{
  cameras: ICamera[];
}>();

</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <div v-for="camera in props.cameras" :key="camera.id" class="bg-blue-500 rounded-lg shadow-md p-4">
      <h2 class="text-lg font-semibold mb-2">{{ camera.name }}</h2>
      <HlsPlayer :src="camera.hls_url" :muted="true" :controls="true" :lock-to-live="true" :live-delay="18" />
      <p class="text-sm text-green-500">Status: {{ camera.status }}</p>
    </div>
  </div>
</template>
