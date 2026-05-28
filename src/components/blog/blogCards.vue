<script setup lang="ts">
interface Topic {
  image: string
  title: string
  category: string
}

const topics: Topic[] = [
  {
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfr62A88yVO-v1pg7VfsdcjX9kbKPEWniSqw&s',
    title: 'Título',
    category: 'Categoria',
  },
  {
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfr62A88yVO-v1pg7VfsdcjX9kbKPEWniSqw&s',
    title: 'Título',
    category: 'Categoria',
  },
  {
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfr62A88yVO-v1pg7VfsdcjX9kbKPEWniSqw&s',
    title: 'Título',
    category: 'Categoria',
  },
  {
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfr62A88yVO-v1pg7VfsdcjX9kbKPEWniSqw&s',
    title: 'Título',
    category: 'Categoria',
  },
]
</script>

<template>
  <section>
    <h2 class="font-semibold ml-12 text-2xl md:text-3xl lg:text-4xl">Explore</h2>

    <div class="flex gap-4 place-content-center">
      <div v-for="(topic, index) in topics" :key="index" class="relative w-70 m-2">
        <img :src="topic.image" alt="ImageCard" class="rounded-2xl w-full h-80 object-cover" />

        <div class="absolute bottom-4 p-2">
          <h3 class="text-2xl font-semibold">{{ topic.title }}</h3>
          <p class="text-xl">{{ topic.category }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
