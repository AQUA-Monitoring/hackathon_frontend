<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBlogStore } from '../stores/Blog'
import type { INotice } from '../types/blog'

const props = defineProps<{
  id: string
}>()

const blogStore = useBlogStore()
const post = ref<INotice | null>(null)

onMounted(async () => {
  const foundNotice = await blogStore.blogs?.find((x) => x.id === props.id)
  post.value = foundNotice || null
})
</script>

<template>
  <section v-if="post" class="max-w-5xl mx-auto px-4 pb-6 md:py-8">
    <img
      :src="`https://api-aqua.michalski.app${post.banner_image.url}`"
      :alt="post.title"
      class="w-full h-48 md:h-96 object-cover rounded-2xl mb-4 md:mb-6"
    />

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

        <div class="w-full rounded-2xl overflow-hidden">
          <img
            :src="`https://api-aqua.michalski.app${post.content_image.url}`"
            alt=""
            class="w-full h-full object-contain"
          />
        </div>
      </div>

      <p>
        {{ post.content }}
      </p>
    </div>
  </section>
</template>
