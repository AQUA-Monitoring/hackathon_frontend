<script setup lang="ts">
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
</script>

<template>
  <div
    v-if="loadingStore.loading"
    class="fixed inset-0 z-50 flex items-center justify-center bg-white/80"
  >
    <img src="/gifs/loading.gif" alt="Carregando..." class="h-50 w-50" />
  </div>
</template>
