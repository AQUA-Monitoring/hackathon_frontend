<script setup lang="ts">
interface Item {
    id: string | number
    icon: string
    name?: string
    link: string | number
    alt?: string
}

const social: Item[] = [
    [
        {
            id: 0,
            icon: '/icons/social/facebook.svg',
            name: 'Facebook',
            link: 'https://www.facebook.com/share/1BVMcTY5sW/',
        },
        { id: 1, icon: '/icons/social/logo.svg', alt: 'Aqua', link: '/' },
        {
            id: 2,
            icon: '/icons/social/instagram.svg',
            name: 'Instagram',
            link: 'https://www.instagram.com/aqua.monitoramento/',
        },
    ],
    [
        {
            id: 0,
            icon: '/icons/social/logo.svg',
            alt: 'Aqua',
            link: '/',
            text: 'Acompanhe-nos também nas redes sociais:',
        },
        {
            id: 1,
            icon: '/icons/social/instagram.svg',
            name: 'Instagram',
            link: 'https://www.instagram.com/aqua.monitoramento/',
            text: 'Instagram: @aqua.monitoramento',
        },
        {
            id: 2,
            icon: '/icons/social/facebook.svg',
            name: 'Facebook',
            link: 'https://www.facebook.com/share/1BVMcTY5sW/',
            text: 'Facebook: Aqua Monitoramento',
        },
    ],
]

const menu: Item[] = [
    [
        { id: 0, name: 'Home', link: '/' },
        { id: 1, name: 'Câmeras', link: '/cameras' },
        { id: 2, name: 'Minha conta', link: '/minha-conta' },
    ],
    [
        { id: 0, name: 'Sobre nós', link: '/sobre' },
        { id: 1, name: 'Mapa', link: '/mapa' },
        { id: 2, name: 'Suporte', link: '/suporte' },
    ],
]
</script>

<template>
    <footer
        class="bg-[#00182F] px-5 pt-10 pb-15 text-white sm:px-10 md:px-15 lg:px-20 lg:pb-5 xl:px-25"
    >
        <div class="grid lg:hidden">
            <ul class="flex items-center justify-center gap-10">
                <li v-for="item in social[0]" :key="item.id">
                    <a v-if="item.name" :href="item.link">
                        <img :src="item.icon" :alt="item.name" />
                    </a>
                    <RouterLink v-else :to="item.link">
                        <div class="rounded-xl bg-white p-0.5">
                            <img :src="item.icon" :alt="item.alt" />
                        </div>
                    </RouterLink>
                </li>
            </ul>

            <nav class="mt-10 flex items-center justify-between">
                <ul>
                    <li v-for="item in menu[0]">
                        <RouterLink :to="item.link">{{ item.name }}</RouterLink>
                    </li>
                </ul>
                <ul>
                    <li v-for="item in menu[1]">
                        <RouterLink :to="item.link">{{ item.name }}</RouterLink>
                    </li>
                </ul>
                <a href="https://www.defesacivil.sc.gov.br/">
                    <img src="/icons/defesacivil.svg" alt="Defesa Civil" />
                </a>
            </nav>

            <a
                href="/Aqua.apk"
                download
                class="mx-auto my-10 flex items-center gap-1 rounded-2xl bg-blue-500 px-10 py-2 font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600"
            >
                Baixe o nosso App
                <span class="material-symbols-outlined">download</span>
            </a>

            <p class="text-center text-sm">aqua.monitoramentogestao@gmail.com</p>
            <p class="text-center text-sm text-[#999999]">
                &copy;2025 - Todos os direitos reservados
            </p>
        </div>

        <div class="hidden lg:grid">
            <div class="flex justify-between">
                <nav class="flex items-center justify-between gap-10">
                    <ul>
                        <li v-for="item in menu[0]">
                            <RouterLink :to="item.link">{{ item.name }}</RouterLink>
                        </li>
                    </ul>
                    <ul>
                        <li v-for="item in menu[1]">
                            <RouterLink :to="item.link">{{ item.name }}</RouterLink>
                        </li>
                    </ul>
                </nav>

                <ul class="grid gap-4">
                    <li v-for="item in social[1]" :key="item.id">
                        <a
                            v-if="item.name"
                            :href="item.link"
                            class="flex items-center justify-center gap-2"
                        >
                            <img :src="item.icon" :alt="item.name" />
                            <span>{{ item.text }}</span>
                        </a>
                        <RouterLink v-else :to="item.link" class="flex items-center gap-2">
                            <div class="rounded-xl bg-white p-0.5">
                                <img :src="item.icon" :alt="item.alt" />
                            </div>
                            <span>{{ item.text }}</span>
                        </RouterLink>
                    </li>
                </ul>

                <div class="flex gap-4">
                    <p>Nossos parceiros:</p>
                    <a href="https://www.defesacivil.sc.gov.br/">
                        <img src="/icons/defesacivil.svg" alt="Defesa Civil" />
                    </a>
                </div>
            </div>

            <p class="mt-10 text-center text-sm text-[#999999]">
                &copy;2025 - Todos os direitos reservados -
                <span class="text-white">aqua.monitoramentogestao@gmail.com</span>
            </p>
        </div>
    </footer>
</template>
