<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import { HeaderComp, FooterComp, MobileMenu } from '@/shared'
import { useFloodPointOfflineQueue, useFloodPointsStore } from '@/modules/flood-points'
import type { IMenu } from '@/shared'
import { useNavigationAuth } from '@/app/composables/useNavigationAuth'
import { REFERENCE_BASE_TEXT } from '@/modules/addressing'

const navigationAuth = useNavigationAuth()

const offlineQueue = useFloodPointOfflineQueue()
const floodPointsStore = useFloodPointsStore()

const syncPendingAlerts = async () => {
  const result = await offlineQueue.flush()
  if (result.synced) {
    await floodPointsStore.refresh()
    toast.success(
      `${result.synced} alerta${result.synced > 1 ? 's' : ''} sincronizado${result.synced > 1 ? 's' : ''}.`,
    )
  }
  if (result.referenceBaseConflict) toast.error(REFERENCE_BASE_TEXT.changed)
  else if (result.errorMessage) toast.error(result.errorMessage)
}

onMounted(() => {
  window.addEventListener('online', syncPendingAlerts)
  syncPendingAlerts()
})

onBeforeUnmount(() => window.removeEventListener('online', syncPendingAlerts))

const menu: IMenu = {
  id: 'menu',
  options: [
    {
      label: 'Home',
      icon: 'home',
      link: '/admin',
    },
    {
      label: 'Cadastre um novo ponto de alagamento',
      icon: 'add',
      link: '/admin/registrar-ponto',
    },
    {
      label: 'Cadastrar nova câmera',
      icon: 'videocam',
      link: '/admin/cameras/cadastro',
    },
    {
      label: 'Gerenciar câmeras',
      icon: 'video_settings',
      link: '/admin/cameras',
    },
    {
      label: 'Impacto territorial e histórico',
      icon: 'flood',
      link: '/admin/impacto-territorial',
    },
    {
      label: 'Alertas operacionais',
      icon: 'notifications_active',
      link: '/admin/alertas',
    },
  ],
}
</script>

<template>
  <div class="min-h-dvh">
    <HeaderComp :title="String($route.name)" v-bind="navigationAuth" />
    <main
      class="min-h-[64vh] relative md:flex grid justify-between gap-10 pb-30 md:pb-10 md:px-15 lg:px-20"
    >
      <nav class="bg-[#0453AF] rounded-full text-white w-20 lg:block hidden">
        <ul class="grid justify-center gap-7 px-7 py-10">
          <li v-for="(item, index) in menu.options" :key="index">
            <RouterLink :to="item.link" :aria-label="item.label" :title="item.label">
              <span class="material-symbols-outlined">{{ item.icon }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <RouterView />
      <MobileMenu :title="String($route.name)" :user-type="navigationAuth.userType" />
    </main>
    <FooterComp />
  </div>
</template>
