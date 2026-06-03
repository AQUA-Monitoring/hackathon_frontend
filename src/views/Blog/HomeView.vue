<script setup lang="ts">
import { BlogHero, BlogCards } from '@/components'

interface Topic {
  title: string
  description: string
}

const topics: Topic[] = [
  {
    title: 'Causas',
    description:
      'Saiba as causas das enchentes em Joinville, como chuvas intensas, marés altas e crescimento urbano',
  },
  {
    title: 'Histórico',
    description:
      'Conheça o histórico das enchentes em Joinville e seus impactos ao longo dos anos.',
  },
  {
    title: 'Dicas',
    description: 'Confira dicas de prevenção e segurança para períodos de enchentes em Joinville.',
  },
]
</script>

<template>
  <section>
    <BlogHero />

    <div class="my-10">
      <h2 class="font-semibold ml-12 mb-10 text-2xl md:text-3xl lg:text-4xl">Encontre</h2>
      <ul class="flex flex-col lg:flex-row px-14">
        <li
          v-for="(topic, index) in topics"
          :key="index"
          :class="[
            index == topics.length - 1 ? '' : 'border-b lg:border-b-0 lg:border-r border-[#0453AF]',
            'w-full h-auto',
            'p-5 grid gap-5',
          ]"
        >
          <h3 class="text-[#0453AF] text-xl md:text-2xl font-semibold">
            {{ topic.title }}
          </h3>
          <p>{{ topic.description }}</p>
        </li>
      </ul>
    </div>

    <BlogCards />
  </section>
</template>
