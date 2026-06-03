<script setup lang="ts">
import { onMounted } from 'vue'
import { useBlogStore } from '@/stores/Blog';

const blogStore = useBlogStore();

onMounted(async () => {
  await blogStore.getNewsBlog()
});
</script>

<template>
  <section class="">
    <h2 class="font-semibold mb-10 text-2xl pl-13 pt-0 md:text-3xl lg:text-4xl">Explore</h2>

    <div class="grid lg:grid-cols-4 gap-10 p-19 pt-0 place-content-center">
      <div v-for="(notice, index) in blogStore.blogs" :key="index" class="relative h-80 flex flex-col lg:flex-row ">
        <img :src="`https://api-aqua.michalski.app/${notice.banner_image.url}`" :alt="notice.title" class="rounded-2xl w-full h-full object-cover  " />
        
        <div class="absolute bottom-4 left-2 text-white ">
          <h3 class="text-2xl md:text-xl font-semibold">{{ notice.title }}</h3>
          <p>{{ notice.subject }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
