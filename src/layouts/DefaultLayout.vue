<script setup lang="ts">
import { HeaderComp, FooterComp } from '@/components'
</script>

<template>
  <HeaderComp :title="String($route.name)" />
  <main class="grid px-5 pb-10 sm:px-10 md:px-15 lg:px-20">
    <RouterView />
  </main>
  <FooterComp />
</template>
