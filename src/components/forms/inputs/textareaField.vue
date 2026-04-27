<script setup lang="ts">
import { type PropType, ref, watch } from 'vue'
import type { IFormField } from '@/types/form'

const props = defineProps({
  field: {
    type: Object as PropType<IFormField>,
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
    <label :for="field.id">{{ field.label }}</label>
    <textarea
      :id="field.id"
      :name="field.id"
      v-model="value"
      required
      :placeholder="field.placeholder"
      rows="7"
      class="rounded-lg border border-[#7AA6C8] px-3 py-3 text-xs text-black outline-none focus:bg-[#7AA6C8]/20 dark:text-[#999999]"
    ></textarea>
  </div>
</template>
