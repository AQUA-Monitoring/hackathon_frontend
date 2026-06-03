<script setup lang="ts">
import { ref } from 'vue'
import HeaderComp from '@/components/general/headerComp.vue'
import FooterComp from '@/components/general/footerComp.vue'

const post = ref({
  title: 'Título da matéria Título da matéria Título da matéria',
  category: 'Causas',
  author: 'Nome do Autor',
  content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
  image: 'https://picsum.photos/1200/500'
})
</script>

<template>
  <div class="bg-white min-h-screen flex flex-col">

    <HeaderComp />

    <main class="flex-1 max-w-5xl mx-auto px-4 py-6 md:py-8">
      <img
        :src="post.image"
        :alt="post.title"
        class="w-full h-48 md:h-64 object-cover rounded-lg mb-4 md:mb-6"
      />

      <p class="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">
        {{ post.category }}
      </p>

      <h1 class="text-xl md:text-3xl font-semibold mb-2 leading-tight">
        {{ post.title }}
      </h1>

      <p class="text-blue-500 text-xs md:text-sm mb-4 md:mb-6">
        {{ post.author }}
      </p>

      <div class="space-y-4 md:space-y-6 text-gray-700 leading-relaxed text-sm md:text-base">

        <p>
          {{ post.content }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">

          <div class="md:col-span-2">
            {{ post.content }}
          </div>

          <!-- Bloco lateral -->
          <div class="w-full h-32 md:h-40 bg-gray-300 rounded-lg"></div>

        </div>

        <p>
          {{ post.content }}
        </p>

      </div>
    </main>

    <FooterComp />

  </div>
</template>
