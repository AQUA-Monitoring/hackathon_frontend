<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div class="bg-white p-6 rounded-3xl w-full mx-8 md:w-150">

      <div class="flex text-gray-500">
        <button @click="$emit('close')" class="material-symbols-outlined align-middle mr-2"><span >
            chevron_left
          </span></button>
        <h2 class="text-xl"><strong class="text-black mr-3 font-semibold">Suporte:</strong>{{ support?.code }}</h2>
      </div>


      <p><strong>Código:</strong> {{ support?.code }}</p>
      <p><strong>Categoria:</strong> {{ support?.category }}</p>
      <p><strong>Status:</strong> {{ support?.status }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Support {
  id: number
  code: string
  requestedAt: string
  category: string
  status: string
}

defineProps<{
  support: Support | null
}>()

defineEmits(['close'])
</script>
