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
            if (to.query.mode === 'login' || to.query.mode === 'register') {
              next()
            } else {
              next({ name: 'NotFound' })
            }
          },
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
