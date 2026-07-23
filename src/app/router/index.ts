import { createRouter, createWebHistory } from 'vue-router'

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
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: '/cameras',
          name: 'Câmeras',
          component: () => import('@/modules/cameras/views/HomeView.vue'),
        },
        {
          path: '/cameras/:id',
          name: 'Câmera',
          component: () => import('@/modules/cameras/views/InfoCameraView.vue'),
          props: true,
        },
        {
          path: '/demo',
          name: 'Demo',
          component: () => import('@/modules/cameras/views/DemoView.vue'),
        },
        {
          path: '/blog',
          name: 'Blog',
          component: () => import('@/modules/blog/views/HomeView.vue'),
        },
        {
          path: '/blog/:id',
          name: 'blog-post',
          component: () => import('@/modules/blog/views/NewsPageView.vue'),
          props: true,
        },
        {
          path: '/suporte',
          name: 'Suporte',
          component: () => import('@/modules/support/views/HomeView.vue'),
        },
        {
          path: '/chat/:id',
          name: 'Chat',
          component: () => import('@/modules/support/views/ChatView.vue'),
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
          component: () => import('@/views/Admin/HomeView.vue'),
        },
        {
          path: '/admin/registrar-ponto',
          name: 'Registrar ponto',
          component: () => import('@/views/Admin/RegisterPointView.vue'),
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
          component: () => import('@/modules/profile/views/SecurityView.vue'),
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
          component: () => import('@/modules/payment/views/HomeView.vue'),
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
          component: () => import('@/modules/auth/views/AuthView.vue'),
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
          component: () => import('@/modules/auth/views/RecoveryView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
