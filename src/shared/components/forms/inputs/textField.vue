<script setup lang="ts">
import { type PropType } from 'vue'
import type { IField } from '@/shared'

defineProps({
  field: {
    type: Object as PropType<IField>,
    required: true,
  },
  modelValue: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function updateValue(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="grid gap-2">
    <label :for="field.id" class="font-semibold">{{ field.label }}</label>
    <input
      :type="field.type"
      :id="field.id"
      :name="field.id"
      :placeholder="field.placeholder"
      :autocomplete="field.autocomplete"
      :value="modelValue"
      @input="updateValue"
      required
      class="w-full rounded-2xl border border-[#7AA6C8] px-3 py-3 text-sm text-black outline-none focus:bg-[#7AA6C8]/20 dark:text-[#999999]"
    />
  </div>
</template>
