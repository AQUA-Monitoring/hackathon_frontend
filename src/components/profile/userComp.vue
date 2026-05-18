<script setup lang="ts">
import { BaseButton } from '@/components'
</script>

<template>
  <section
    class="w-180 h-[88vh] grid justify-center items-center text-center p-10 border-r border-[#999999]"
  >
    <div class="relative mb-5">
      <img src="/profile/background.png" alt="Background" class="w-full h-full object-cover" />

      <div
        class="absolute left-1/2 bottom-0 h-45 w-45 -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full bg-[#d9d9d9] border-4 border-white"
      >
        <img
          src=""
          alt=""
          class="h-full w-full object-cover transition-[filter] duration-300 ease-in-out"
        />
      </div>
    </div>

    <h1 class="text-2xl font-semibold">Fulano Ciclano Beltrano</h1>

    <ul class="text-left">
      <li>Email:</li>
      <li>Data de nascimento:</li>
      <li>Data da criação da conta:</li>
    </ul>

    <BaseButton button-text="Editar informações" />
  </section>
</template>
