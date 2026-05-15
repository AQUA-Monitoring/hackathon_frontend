<script setup lang="ts">
import { HeaderComp, FooterComp, MobileMenu } from '@/components'
</script>

<template>
  <HeaderComp :title="String($route.name)" />
  <main class="grid sm:px-10 md:px-15 lg:px-20">
    <RouterView />
    <MobileMenu :title="String($route.name)" />
  </main>
  <FooterComp />
</template>
