<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BaseButton } from '@/components'
import { useAuthStore } from '@/modules/auth'

const authStore = useAuthStore()

const profileImage = computed<string | null>(() => {
  const picture = authStore.user?.profile_picture
  if (!picture) return null
  return picture.startsWith('http') ? picture : `https://api-aqua.michalski.app${picture}`
})

const previewImage = ref<string | null>(null)

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.getMe()
    } catch {
      authStore.logout({ silent: true })
    }
  }
})
// const profileUser: IUser = reactive({
//   name: user?.name || '',
//   email: user?.email || '',
//   type: user?.type || '',
//   profile_picture: `https://api-aqua.michalski.app${user?.profile_picture}` || '',
// })

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

  previewImage.value = URL.createObjectURL(file)
  authStore.updateMe({ profile_picture: file }).catch(() => {
    previewImage.value = null
  })
}

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <section
    class="lg:w-180 h-[65vh] lg:h-[88vh] grid justify-center items-center text-center mb-10 lg:mb-0 p-10 lg:border-r border-[#999999]"
  >
    <div class="relative mb-5">
      <img src="/profile/background.png" alt="Background" class="w-full h-full object-cover" />

      <button
        type="button"
        @click="openFilePicker"
        class="group absolute left-1/2 bottom-0 h-35 w-35 lg:h-45 lg:w-45 -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-[#d9d9d9] cursor-pointer"
      >
        <img
          :src="previewImage || profileImage || '/profile/default-avatar.png'"
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

    <h1 class="text-2xl font-semibold mt-15">{{ authStore.user?.name || 'Usuário' }}</h1>

    <ul class="text-left mt-3">
      <li>Nome: {{ authStore.user?.name }}</li>
      <li>Email: {{ authStore.user?.email }}</li>
    </ul>

    <div class="mt-5 flex flex-col gap-3">
      <BaseButton button-text="Editar informações" />
      <BaseButton button-text="Sair da conta" @click="handleLogout" :is-delete="true" />
    </div>
  </section>
</template>
