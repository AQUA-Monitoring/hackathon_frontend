<script setup lang="ts">
import { type PropType, ref, watch } from 'vue'
import type { IField } from '@/types/form'

const props = defineProps({
  field: {
    type: Object as PropType<IField>,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const value = ref(props.modelValue)

watch(value, (val) => emit('update:modelValue', val))
</script>

<template>
  <div class="grid gap-2">
    <label :for="field.id" class="font-semibold">{{ field.label }}</label>
    <div class="flex justify-center">
      <select
        :id="field.id"
        :name="field.id"
        v-model="value"
        class="w-full rounded-2xl border border-[#7AA6C8] px-3 py-2 text-sm text-[#999999] outline-none"
      >
        <option value="">{{ field.name || 'Selecione' }}</option>
        <option
          v-for="(option, index) in field.options"
          :key="option"
          :value="field.id === 'year' ? option : index + 1"
        >
          {{ option }}
        </option>
      </select>
    </div>
  </div>
</template>
