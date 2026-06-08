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
          path: '/suporte',
          name: 'Suporte',
          component: () => import('../views/Support/SupportPageView.vue'),
        },
        {
          path: '/blog',
          name: 'Blog',
          component: () => import('../views/Blog/HomeView.vue'),
        },
        {
          path: '/admin',
          name: 'Administração',
          component: () => import('../views/Admin/HomeView.vue'),
        },
        {
          path: '/blog',
          name: 'blog',
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
          component: () => import('../views/Support/SupportPageView.vue'),
        },
        {
              path: '/chat',
              name: 'Chat',
              component: () => import('../views/Support/SupportChatView.vue'),
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
        {
          path: '/registrar-duvida',
          name: 'Registrar dúvida',
          component: () => import('../views/Profile/RegisterDoubtView.vue'),
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
