<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { type ISupport, supports } from '../types/support'

const props = defineProps<{ id: string }>()

const chat = ref<ISupport | null>(null)

onMounted(async () => {
  // const foundChat = await blogStore.blogs?.find((x) => x.id === props.id)
  // chat.value = foundChat || null
  const foundChat = supports.find((x) => x.id === parseInt(props.id))
  chat.value = foundChat || null
})
</script>

<template>
  <section class="flex flex-col w-full mx-auto p-4">
    <ul class="h-[80vh] md:h-[70vh] overflow-y-auto space-y-4 pr-2">
      <li
        v-for="(message, index) in chat?.messages"
        :key="index"
        :class="[
          'py-5 px-10 rounded-4xl shadow-[0_0_8px_rgba(0,0,0,0.1)] border-2 max-w-3xl',
          message.sender.type === 'admin'
            ? 'border-[#2966C1] bg-white rounded-tl-none mr-auto dark:bg-slate-900 dark:text-gray-100 dark:border-blue-500'
            : 'border-[#7AA6C8] bg-gray-50 rounded-br-none ml-auto dark:bg-slate-800 dark:text-gray-100 dark:border-cyan-600',
        ]"
      >
        <div class="flex items-center gap-2 mb-2">
          <img
            :src="
              message.sender.profile_picture
                ? message.sender.profile_picture
                : '/icons/aqua-512.png'
            "
            :alt="message.sender.name"
            class="w-10 h-10 rounded-full object-cover"
          />
          <p class="font-semibold text-sm">{{ message.sender.name }}</p>
          <p class="text-gray-500 text-xs ml-auto">{{ message.sentAt }}</p>
        </div>
        <p class="wrap-break-words">
          {{ message.content }}
        </p>
      </li>
    </ul>
  </section>

  <div
    class="flex items-center fixed md:relative bottom-30 md:bottom-auto w-full justify-center mx-auto"
  >
    <input
      type="text"
      placeholder="Escreva aqui sua dúvida"
      class="border-2 border-[#7AA6C8] rounded-full px-2 py-2 mr-2 w-75 md:w-400 text-gray-700"
    />
    <input
      type="submit"
      value="send"
      class="material-symbols-outlined rounded-full bg-[#2966C1] active:bg-[#2966C1]/90 h-10 w-10 text-white"
    />
  </div>
</template>
