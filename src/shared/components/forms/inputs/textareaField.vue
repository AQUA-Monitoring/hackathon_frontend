<script setup lang="ts">
import { type PropType, ref, watch } from 'vue'
import type { IField } from '@/shared'

const props = defineProps({
  field: {
    type: Object as PropType<IField>,
    required: true,
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const value = ref(props.modelValue)

watch(value, (val) => emit('update:modelValue', val))
</script>

<template>
  <div class="grid gap-2">
    <label :for="field.id" class="font-semibold">{{ field.label }}</label>
    <textarea
      :id="field.id"
      :name="field.id"
      v-model="value"
      required
      :placeholder="field.placeholder"
      rows="7"
      class="rounded-2xl border border-[#7AA6C8] px-3 py-3 text-sm text-black outline-none focus:bg-[#7AA6C8]/20 dark:text-[#999999]"
    ></textarea>
  </div>
</template>
