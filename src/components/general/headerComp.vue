<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { ThemeSwitcher } from '@/components'
import { useScreenSize } from '@/composables/screenSize'

const props = defineProps<{ title?: string }>()

const router = useRouter()
const authStore = { user: { is_superuser: true } }
const { isMobile } = useScreenSize()
const openMenuId = ref<number | null>(null)
const toggleMenu = (id: number) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const allowedTitles = [
  'Recuperação',
  'Cadastrar um novo ponto',
  'Cadastrar ocorrência',
  'Históricos',
  'Editar clima',
  'Cadastrar notificação',
  'Sobre Nós',
  'Pagamento',
  'Meu perfil',
  'Dashboard',
  'Suporte',
  'Registrar Dúvida',
  'Enviar Mensagem',
  'Perfil',
  'Segurança',
]
const shouldShowTitle = computed(() => allowedTitles.includes(props.title ?? ''))

interface MenuItem {
  id: number
  label?: string
  link?: string | RouteLocationRaw
  img?: string
  icon?: string
  options?: { id: number; label: string; link: string }[]
}

const desktopMenu: MenuItem[] = [
  { id: 0, img: '/icons/social/logo.svg', label: 'Aqua', link: '/' },
  { id: 1, label: 'Início', link: '/' },
  { id: 2, label: 'Câmeras', link: '/cameras' },
  {
    id: 3,
    label: 'Mais',
    options: [
      { id: 0, label: 'Blog', link: '/blog' },
      { id: 1, label: 'Doar', link: '/pagamento' },
      { id: 2, label: 'Suporte', link: '/suporte' },
    ],
  },
]

const desktopMenuAccount: MenuItem[] = [
  { id: 0, label: 'Entrar', link: { name: 'auth', query: { mode: 'login' } } },
  { id: 1, label: 'Criar conta', link: { name: 'auth', query: { mode: 'register' } } },
  { id: 2, icon: 'person', link: '/minha-conta/nicolefemello' },
]
</script>

<template>
  <header
    v-if="!(isMobile && title === 'Início')"
    class="z-10 bg-transparent px-7 lg:bg-white lg:px-20 xl:px-25 py-3 lg:dark:bg-[#00182F]"
  >
    <nav class="lg:flex lg:items-center lg:justify-between">
      <ul class="flex items-center justify-between lg:hidden">
        <li>
          <button class="material-symbols-outlined text-[#999999]" @click="router.back()">
            arrow_back_ios
          </button>
        </li>
        <li><img src="/icons/social/logo.svg" alt="Aqua" class="ml-3" /></li>
        <li><ThemeSwitcher /></li>
      </ul>

      <ul class="hidden items-center gap-7 lg:flex">
        <li
          v-for="item in desktopMenu"
          :key="item.id"
          :class="item.label == title ? 'text-[#2768CA]' : ''"
          class="relative cursor-pointer"
        >
          <RouterLink v-if="item.img" :to="item.link">
            <img :src="item.img" :alt="item.label" class="h-15 w-15 object-contain" />
          </RouterLink>

          <RouterLink v-else-if="!item.options" :to="item.link">
            {{ item.label }}
          </RouterLink>

          <div v-else>
            <button
              @click="toggleMenu(item.id)"
              :aria-expanded="openMenuId === item.id"
              class="flex cursor-pointer items-center"
            >
              {{ item.label }}
              <span
                class="material-symbols-outlined transition-all duration-300 ease-out"
                :class="openMenuId === item.id ? 'rotate-180' : 'rotate-0'"
                >keyboard_arrow_down</span
              >
            </button>
            <transition name="fade">
              <ul
                v-if="openMenuId === item.id"
                class="absolute -left-5 z-10 mt-2 grid w-[10vw] gap-2 rounded-lg bg-white px-5 py-5 shadow-lg dark:bg-[#000d19]"
              >
                <li
                  v-for="menu in item.options"
                  :key="menu.id"
                  class="border-b border-[#000D19] p-2 text-center dark:border-white"
                >
                  <RouterLink :to="menu.link">{{ menu.label }}</RouterLink>
                </li>
              </ul>
            </transition>
          </div>
        </li>
        <li
          v-if="authStore.user?.is_superuser"
          :class="'Administração' == title ? 'text-[#2768CA]' : ''"
          class="relative cursor-pointer"
        >
          <RouterLink to="/admin"> Administração </RouterLink>
        </li>
      </ul>

      <ul class="hidden items-center gap-7 lg:flex">
        <li v-for="item in desktopMenuAccount" :key="item.id" class="cursor-pointer">
          <RouterLink v-if="item.icon" :to="item.link">
            <!-- authStore.token?.access || localStorage.getItem('access_token') -->
            <span class="material-symbols-outlined lg:scale-140">{{ item.icon }}</span>
          </RouterLink>

          <RouterLink
            v-else
            :to="item.link"
            :class="
              item.label == 'Criar conta'
                ? 'rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors duration-300 hover:bg-blue-600'
                : ''
            "
          >
            {{ item.label }}
          </RouterLink>
        </li>
        <li>
          <ThemeSwitcher class="hidden lg:block" />
        </li>
      </ul>
    </nav>
  </header>

  <div v-if="shouldShowTitle" class="grid lg:hidden">
    <h1 class="text-center">{{ title }}</h1>
  </div>
</template>
