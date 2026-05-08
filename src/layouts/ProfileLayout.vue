<script setup lang="ts">
import { HeaderComp, FooterComp, UserComp } from '@/components'
</script>

<template>
  <HeaderComp :title="String($route.name)" />
  <main class="flex px-5 pb-10 sm:px-10 md:px-15 lg:px-20 min-h-screen">
    <UserComp />
    <RouterView />
  </main>
  <FooterComp />
</template>
