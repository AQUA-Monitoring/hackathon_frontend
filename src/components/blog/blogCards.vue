<script setup lang="ts">
import { onMounted } from 'vue'
import { useBlogStore } from '@/stores/Blog';

const blogStore = useBlogStore();
    
onMounted(async () => {
  await blogStore.getNewsBlog()
});
</script>

<template>
  <section class="p-20 pt-0">
    <h2 class="font-semibold ml-12 mb-5 text-2xl md:text-3xl lg:text-4xl">Explore</h2>

    <div class="grid grid-cols-4 gap-10 place-content-center">
      <div v-for="(notice, index) in blogStore.blogs" :key="index" class="relative h-80">
        <img :src="`https://api-aqua.michalski.app/${notice.banner_image.url}`" :alt="notice.title" class="rounded-2xl w-full h-full object-cover" />

        <div class="absolute bottom-4 left-2 text-white">
          <h3 class="text-2xl font-semibold">{{ notice.title }}</h3>
          <p>{{ notice.subject }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
