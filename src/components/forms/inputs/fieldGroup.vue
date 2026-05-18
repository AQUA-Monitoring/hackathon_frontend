<script setup lang="ts">
import { type PropType, reactive, watch } from 'vue'
import type { IFormField } from '@/types/form'
import { TextField } from '@/components'

const props = defineProps({
  fields: {
    type: Array as PropType<IFormField[]>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const groupValues = reactive<Record<string, any>>({})

props.fields.forEach((field) => {
  groupValues[field.id] = props.modelValue[field.id] ?? ''
})

watch(
  () => ({ ...groupValues }),
  (val) => {
    emit('update:modelValue', val)
  },
  { deep: true },
)
</script>

<template>
  <div class="flex justify-center gap-3">
    <TextField
      v-for="field in fields"
      :key="field.id"
      :field="field"
      v-model="groupValues[field.id]"
    />
  </div>
</template>
