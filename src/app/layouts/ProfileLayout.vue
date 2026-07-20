<script setup lang="ts">
import { FooterComp, HeaderComp, MobileMenu } from '@/components'
import { ProfileUser } from '@/modules/profile'
</script>

<template>
  <div class="min-h-dvh">
    <HeaderComp :title="String($route.name)" />
    <main class="min-h-[64vh] grid lg:flex px-5 pb-30 md:pb-10 sm:px-10 md:px-15 lg:px-20">
      <ProfileUser />
      <RouterView />
      <MobileMenu :title="String($route.name)" />
    </main>
    <FooterComp />
  </div>
</template>
