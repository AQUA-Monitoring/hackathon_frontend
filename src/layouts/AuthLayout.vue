<script setup lang="ts">
import { HeaderComp, MobileMenu } from '@/components'
</script>

<template>
  <div class="min-h-dvh">
    <HeaderComp :title="String($route.name)" />
    <main class="min-h-[94vh] grid lg:px-20">
      <RouterView />
    </main>
    <MobileMenu :title="String($route.name)" />
    <div
      class="fixed bottom-0 -z-10 inset-0 w-screen bg-contain bg-bottom bg-no-repeat lg:hidden"
      style="background-image: url('/layouts/wavesMobile.svg')"
    ></div>
  </div>
</template>
