<script setup lang="ts">
import { HeaderComp, FooterComp, UserComp } from '@/components'
</script>

<template>
  <div class="min-h-dvh">
    <HeaderComp :title="String($route.name)" />
    <main class="min-h-[64vh] flex px-5 pb-10 sm:px-10 md:px-15 lg:px-20">
      <UserComp />
      <RouterView />
    </main>
    <FooterComp />
  </div>
</template>
