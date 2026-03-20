<script setup lang="ts">
interface IInfo {
    title: string
    img?: string
    text: string[]
}

const info: IInfo[] = [
    {
        title: 'A nossa história',
        text: [
            `Em 2025, um grupo de estudantes do curso técnico de Informática para
                        Internet do Instituto Federal Catarinense (IFC) participou do Hackathon, uma
                        maratona anual de inovação destinada a todas as turmas do 2º ano. O tema
                        proposto para o evento foi “Desafios sociais do cotidiano” e, entre várias
                        possibilidades, nosso grupo decidiu focar em um problema que afeta
                        diretamente a vida de muitas pessoas em nossa região: os alagamentos.`,
            `Cada grupo teve três meses para tirar a ideia do papel, passando pelo
                        planejamento até a entrega do protótipo final. Diante desse desafio,
                        escolhemos desenvolver o AQUA, uma plataforma voltada a informar, alertar e
                        auxiliar a população em situações de alagamento.`,
            `Para fortalecer nosso projeto, contamos com o apoio e a orientação da Defesa
                        Civil de Joinville, que nos ajudou a compreender melhor o tema e nos
                        forneceu dados importantes, os quais serviram de base para o desenvolvimento
                        da plataforma.`,
        ],
    },
    {
        title: 'Nossos objetivos',
        img: '/about/theInfinityGauntlet.jpg',
        text: [
            `O sistema tem como objetivo principal oferecer uma plataforma web integrada para o
                monitoramento em tempo real de alagamentos e eventos hidrológicos extremos em
                Joinville, apoiando a tomada de decisões preventivas e estratégicas. Para isso,
                busca:`,
            `Monitorar em tempo real áreas críticas da cidade, utilizando câmeras
                        públicas estrategicamente posicionadas e técnicas de visão computacional
                        para detectar ocorrências de alagamentos;`,
            `Analisar imagens e dados históricos de eventos passados, permitindo a
                        identificação de padrões recorrentes e a atualização contínua da base de
                        dados, aprimorando a capacidade preditiva da plataforma;`,
            `Integrar múltiplas fontes de dados meteorológicos, hidrológicos e
                        topográficos, como precipitação, temperatura, umidade, pressão atmosférica,
                        nível dos rios e elevação do terreno, fornecendo uma visão completa e
                        contextualizada do cenário urbano;`,
            `Disponibilizar um mapa interativo, no qual usuários possam visualizar áreas
                        em risco em tempo real, além de cadastrar pontos de alagamento em
                        localizações específicas e períodos determinados, possibilitando análises
                        espaciais e temporais detalhadas;`,
            `Emitir alertas de risco à população e aos órgãos públicos, por meio da atuação
                    de administradores responsáveis pelo gerenciamento do sistema, aumentando a
                    agilidade da resposta a situações emergenciais;`,
            `Apoiar o planejamento urbano e a mitigação de riscos, oferecendo uma ferramenta
                    robusta para análise preditiva e para a elaboração de estratégias de prevenção e
                    resposta a eventos hidrológicos extremos;`,
            `Garantir alinhamento institucional e técnico, com a participação ativa da Defesa
                    Civil na definição de critérios de risco, validação de prioridades e integração
                    com o Plano de Contingência de Proteção e Defesa Civil (Plancon).`,
        ],
    },
]
</script>

<template>
    <div
        class="mx-auto max-w-5xl gap-8 px-5 py-8 text-justify indent-4 sm:px-10 md:px-15 lg:px-20 xl:px-25"
    >
        <section v-for="topic in info" class="my-4 grid gap-5">
            <h2
                class="text-center text-lg font-semibold text-gray-900 lg:text-2xl dark:text-gray-100"
            >
                {{ topic.title }}
            </h2>
            <Transition
                v-if="topic.img"
                appear
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
            >
                <div
                    class="overflow-hidden rounded-2xl ring-1 ring-gray-200 ring-inset dark:ring-zinc-800"
                >
                    <img
                        :src="topic.img"
                        :alt="topic.title"
                        class="mx-auto w-full object-cover"
                        loading="lazy"
                    />
                </div>
            </Transition>
            <p v-for="paragraph in topic.text" class="text-gray-800 lg:text-lg dark:text-gray-200">
                {{ paragraph }}
            </p>
        </section>
    </div>
</template>
