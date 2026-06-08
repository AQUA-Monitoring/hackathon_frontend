<script setup lang="ts">
// import BaseButton from '@/components/buttons/baseButton.vue'

</script>


<template>
    <!-- v-for=" support in supports" :key="support.id"
  :support="support" -->
    <div class="m-5 p-5 rounded-4xl rounded-tl-none shadow-[0_0_8px_rgba(0,0,0,0.1)] md:w-full md:mx-auto">
      <div class="flex items-center">
        <img src="../../../public/icons/aqua-512.png" alt="teste" class="w-15 h-auto rounded-full">
        <p class="mr-auto">USER</p>
        <p class="text-gray-500">DD/MM/AAAA 00:00</p>
      </div>
      <p class="text-justify">Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi maxime officiis earum
        est facere neque vero! Blanditiis excepturi accusamus sit rerum quae velit laboriosam magni quam eveniet,
        reiciendis nesciunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quis, fuga voluptates error exercitationem repellendus dolorum! Optio tenetur in et repellendus quo modi, eos non quidem ipsa. Pariatur alias necessitatibus deserunt?</p>
    </div>

    <!-- <div class="grid grid-cols-3 md:grid-cols-5 gap-10  md:gap-8 mt-10 md:mt-8">
              //<img v-for="image in images" :key="image.id" />
        <img src="../../../public/icons/aqua-512.png" alt="teste">
        <img src="../../../public/icons/aqua-512.png" alt="teste">
        <img src="../../../public/icons/aqua-512.png" alt="teste">
      </div> -->

    <div class=" flex items-center fixed md:relative bottom-30 md:bottom-auto w-full justify-center mx-auto">
      <input type="text" placeholder="Escreva aqui sua dúvida"
        class="border-2 border-[#7AA6C8] rounded-full px-2 py-2 mr-2 w-75 md:w-400">
      <input type="submit" value="send"
        class="material-symbols-outlined rounded-full bg-[#2966C1] active:bg-[#2966C1]/90 h-10 w-10 text-white">
    </div>
</template>

