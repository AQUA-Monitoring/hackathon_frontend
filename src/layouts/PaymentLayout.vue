<script setup lang="ts">
import { HeaderComp, MobileMenu } from '@/components'
</script>

<template>
  <div class="relative min-h-dvh overflow-hidden">
    <HeaderComp :title="String($route.name)" />
    <main class="min-h-[64vh] grid lg:px-20 pt-20 pb-30 lg:py-0">
      <RouterView />
      <MobileMenu :title="String($route.name)" />
    </main>
    <div
      class="absolute -bottom-10 -z-10 w-full h-full pointer-events-none bg-contain bg-bottom bg-no-repeat"
      style="background-image: url('/layouts/wavesPayment.svg')"
    ></div>
  </div>
</template>
