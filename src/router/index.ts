import { createRouter, createWebHistory } from 'vue-router'

async function requireCameraAdmin() {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated || !authStore.token?.access) {
    return { name: 'auth', query: { mode: 'login', redirect: '/admin/cameras/cadastro' } }
  }

  if (!authStore.user) {
    try {
      await authStore.getMe()
    } catch {
      return { name: 'auth', query: { mode: 'login', redirect: '/admin/cameras/cadastro' } }
    }
  }

  if (authStore.user?.type !== 'admin') return { name: 'Início' }
  return true
}

const requireAdmin = requireCameraAdmin

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/DefaultLayout.vue'),
      children: [
        {
          path: '/',
          name: 'Início',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: '/cameras',
          name: 'Câmeras',
          component: () => import('../views/Camera/HomeView.vue'),
        },
        {
          path: '/cameras/:id',
          name: 'Câmera',
          component: () => import('../views/Camera/InfoCameraView.vue'),
          props: true,
        },
        {
          path: '/demo',
          name: 'Demo',
          component: () => import('../views/Camera/DemoView.vue'),
        },
        {
          path: '/blog',
          name: 'Blog',
          component: () => import('../views/Blog/HomeView.vue'),
        },
        {
          path: '/blog/:id',
          name: 'blog-post',
          component: () => import('../views/Blog/NewsPageView.vue'),
          props: true,
        },
        {
          path: '/suporte',
          name: 'Suporte',
          component: () => import('../views/Support/HomeView.vue'),
        },
        {
          path: '/chat/:id',
          name: 'Chat',
          component: () => import('../views/Support/ChatView.vue'),
          props: true,
        },
      ],
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        {
          path: '/admin',
          name: 'Administração',
          component: () => import('../views/Admin/HomeView.vue'),
        },
        {
          path: '/admin/registrar-ponto',
          name: 'Registrar ponto',
          component: () => import('../views/Admin/RegisterPointView.vue'),
          beforeEnter: requireAdmin,
        },
        {
          path: '/admin/cameras/cadastro',
          name: 'Cadastrar câmera',
          component: () => import('../views/Admin/RegisterCameraView.vue'),
          beforeEnter: requireCameraAdmin,
        },
        {
          path: '/admin/impacto-territorial',
          name: 'Impacto territorial',
          component: () => import('../views/Admin/FloodImpactView.vue'),
          beforeEnter: requireAdmin,
        },
      ],
    },
    {
      path: '/',
      component: () => import('../layouts/ProfileLayout.vue'),
      children: [
        {
          path: '/seguranca',
          name: 'Segurança',
          component: () => import('../views/Profile/SecurityView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: () => import('../layouts/PaymentLayout.vue'),
      children: [
        {
          path: '/doacao',
          name: 'Pagamento',
          component: () => import('../views/Payment/HomeView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: () => import('../layouts/AuthLayout.vue'),
      children: [
        {
          path: '/auth',
          name: 'auth',
          component: () => import('../views/Auth/AuthView.vue'),
          beforeEnter: (to, from, next) => {
            const mode = to.query.mode
            if (mode !== 'login' && mode !== 'register') return next({ name: 'NotFound' })
            to.meta.title = mode === 'login' ? 'Entrar' : 'Cadastro'
            next()
          },
        },
        {
          path: '/recuperacao',
          name: 'Recuperação',
          component: () => import('../views/Auth/RecoveryView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
