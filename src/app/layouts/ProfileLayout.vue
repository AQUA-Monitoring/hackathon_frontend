<script setup lang="ts">
import { FooterComp, HeaderComp, MobileMenu } from '@/shared'
import { ProfileUser } from '@/modules/profile'
import { useNavigationAuth } from '@/app/composables/useNavigationAuth'

const navigationAuth = useNavigationAuth()
</script>

<template>
  <div class="min-h-dvh">
    <HeaderComp :title="String($route.name)" v-bind="navigationAuth" />
    <main class="min-h-[64vh] grid lg:flex px-5 pb-30 md:pb-10 sm:px-10 md:px-15 lg:px-20">
      <ProfileUser />
      <div class="min-w-0 flex-1">
        <nav aria-label="Configurações do perfil" class="mx-auto mt-5 flex max-w-3xl gap-2 px-5 lg:px-10">
          <RouterLink to="/seguranca" class="rounded-full px-4 py-2 text-sm font-semibold" active-class="bg-[#2768CA] text-white">Segurança</RouterLink>
          <RouterLink to="/notificacoes" class="rounded-full px-4 py-2 text-sm font-semibold" active-class="bg-[#2768CA] text-white">Notificações</RouterLink>
        </nav>
        <RouterView />
      </div>
      <MobileMenu :title="String($route.name)" :user-type="navigationAuth.userType" />
    </main>
    <FooterComp />
  </div>
</template>
