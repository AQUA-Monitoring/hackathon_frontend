<script setup lang="ts">
import { ref } from 'vue'
import { useScreenSize } from '@/composables/screenSize'
import { BaseButton } from '@/components'

const { isDesktop } = useScreenSize()
const profileImage = ref<string>('')
const fileInput = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || !target.files[0]) return
  const file = target.files[0]

  if (!file.type.startsWith('image/')) {
    alert('Selecione uma imagem válida.')
    return
  }

  profileImage.value = URL.createObjectURL(file)
}
</script>

<template>
  <section
    v-if="isDesktop"
    class="w-180 h-[88vh] grid justify-center items-center text-center p-10 border-r border-[#999999]"
  >
    <div class="relative mb-5">
      <img src="/profile/background.png" alt="Background" class="w-full h-full object-cover" />

      <button
        type="button"
        @click="openFilePicker"
        class="group absolute left-1/2 bottom-0 h-45 w-45 -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-[#d9d9d9] cursor-pointer"
      >
        <img
          :src="profileImage || '/profile/default-user.svg'"
          alt="Foto de perfil"
          class="h-full w-full object-cover transition duration-300 group-hover:brightness-75"
        />

        <div
          class="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100"
        >
          <span class="text-sm font-medium text-white"> Alterar foto </span>
        </div>
      </button>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />
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
