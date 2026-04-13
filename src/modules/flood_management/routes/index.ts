import { IRoutes } from '@/@core/interfaces/route'

const routes: IRoutes[] = [
    {
        path: '/',
        component: () => import('@/@templates/layouts/Default.vue'),
        children: [
            {
                path: '/admin',
                name: 'Administração',
                component: () => import('@/modules/flood_management/infra/pages/index.vue'),
            },
            {
                path: '/admin/registrar-ponto',
                name: 'Cadastrar um novo ponto',
                component: () => import('@/modules/flood_management/infra/pages/RegisterPoint.vue'),
            },
            {
                path: '/admin/registrar-ocorrencia',
                name: 'Cadastrar ocorrência',
                component: () =>
                    import('@/modules/flood_management/infra/pages/RegisterIncident.vue'),
            },
            {
                path: '/admin/historico',
                name: 'Históricos',
                component: () => import('@/modules/flood_management/infra/pages/History.vue'),
            },
            {
                path: '/admin/dados-cadastrados/:id',
                name: 'Dados cadastrados',
                component: () =>
                    import('@/modules/flood_management/infra/pages/RegisteredData.vue'),
                props: true,
            },
            {
                path: '/admin/editar-clima/:id',
                name: 'Editar clima',
                component: () => import('@/modules/flood_management/infra/pages/EditWeather.vue'),
            },
            {
                path: '/admin/registrar-notificacao',
                name: 'Cadastrar notificação',
                component: () =>
                    import('@/modules/flood_management/infra/pages/RegisterNotification.vue'),
            },
        ],
    },
    {
        path: '/admin/mapa-de-alagamento',
        name: 'Mapa de Alagamento',
        component: () => import('@/modules/flood_management/infra/pages/FloodMap.vue'),
    },
]

export default routes
