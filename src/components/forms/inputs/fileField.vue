<script setup lang="ts">
import { type PropType, ref, watch } from 'vue'
import type { IFormField } from '@/types/form'

const props = defineProps({
  field: {
    type: Object as PropType<IFormField>,
    required: true,
  },
  modelValue: {
    type: File as PropType<File | null>,
    default: null,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | null): void
}>()

const file = ref<File | null>(props.modelValue)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  file.value = target.files ? target.files[0] : null
}

watch(file, (val) => {
  emit('update:modelValue', val)
})
</script>

<template>
  <div class="grid gap-2">
    <label :for="field.id">{{ field.label }}</label>

    <label
      class="mx-auto flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-2 font-semibold text-white transition-colors duration-300 hover:bg-blue-600"
    >
      <span>Selecionar arquivo</span>
      <input
        :type="field.type"
        :id="field.id"
        :name="field.id"
        class="hidden"
        @change="handleFileChange"
      />
      <span class="material-symbols-outlined">upload</span>
    </label>

    <p v-if="file" class="text-xs text-gray-700">Arquivo selecionado: {{ file.name }}</p>
  </div>
</template>
