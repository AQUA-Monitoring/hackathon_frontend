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
          component: () => import('../views/CamerasView.vue'),
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
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'),
    },
    {
    path: '/blog',
    name: 'blog',
    component: () => import('../views/Blog/BlogHomeView.vue'),
}
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
