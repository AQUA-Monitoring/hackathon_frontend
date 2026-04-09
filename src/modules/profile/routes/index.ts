import { IRoutes } from '@/@core/interfaces/route'

const routes: IRoutes[] = [
    {
        path: '/',
        component: () => import('@/@templates/layouts/Default.vue'),
        children: [
            {
                path: '/minha-conta',
                name: 'Meu perfil',
                component: () => import('@/modules/profile/infra/pages/index.vue'),
                meta: { requiresAuth: true },
                beforeEnter: () => {
                    if (window.innerWidth >= 1024) {
                        return { name: 'NotFound' }
                    }
                },
            },
            {
                path: '/dashboard',
                name: 'Dashboard',
                component: () => import('@/modules/profile/infra/pages/Dashboard.vue'),
                meta: { requiresAuth: true },
            },
            {
                path: '/suporte',
                name: 'Suporte',
                component: () => import('@/modules/profile/infra/pages/Support.vue'),
                meta: { requiresAuth: true },
            },
            {
                path: '/suporte/registro',
                name: 'Registrar Dúvida',
                component: () => import('@/modules/profile/infra/pages/RegisterTicket.vue'),
                meta: { requiresAuth: true },
            },
            {
                path: '/suporte/enviar-mensagem',
                name: 'Enviar Mensagem',
                component: () => import('@/modules/profile/infra/pages/SendMessage.vue'),
                meta: { requiresAuth: true },
            },
        ],
    },
    {
        path: '/',
        component: () => import('@/@templates/layouts/Profile.vue'),
        children: [
            {
                path: '/minha-conta/:id',
                name: 'Perfil',
                component: () => import('@/modules/profile/infra/pages/Profile.vue'),
                meta: { requiresAuth: true },
            },
            {
                path: '/seguranca',
                name: 'Segurança',
                component: () => import('@/modules/profile/infra/pages/Security.vue'),
                meta: { requiresAuth: true },
            },
        ],
    },
]

export default routes
