<script setup lang="ts">
import { HeaderComp, FooterComp, MobileMenu } from '@/components'
</script>

<template>
  <div class="min-h-dvh">
    <HeaderComp :title="String($route.name)" />
    <main class="min-h-[64vh] relative grid pb-30 md:pb-10 md:px-15 lg:px-20">
      <RouterView />
      <MobileMenu :title="String($route.name)" />
    </main>
    <FooterComp />
  </div>
</template>
