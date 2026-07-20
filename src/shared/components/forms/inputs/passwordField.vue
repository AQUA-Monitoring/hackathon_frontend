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

const isVisible = ref(false)
const togglePasswordVisibility = () => {
  isVisible.value = !isVisible.value
}
</script>

<template>
  <div class="grid gap-2">
    <label :for="field.id" class="font-semibold">{{ field.label }}</label>
    <div class="relative">
      <input
        :type="isVisible ? 'text' : 'password'"
        :id="field.id"
        :name="field.id"
        :placeholder="field.placeholder"
        :autocomplete="field.autocomplete"
        v-model="value"
        required
        class="w-full rounded-2xl border border-[#7AA6C8] px-3 py-3 text-sm text-black outline-none focus:bg-[#7AA6C8]/20 dark:text-[#999999]"
      />
      <span
        @click="togglePasswordVisibility"
        class="material-symbols-outlined absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#999999]"
      >
        {{ isVisible ? 'visibility_off' : 'visibility' }}
      </span>
    </div>
  </div>
</template>
