<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  field: {
    type: Object,
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

const passwordVisible = ref(false)

function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value
}

function updateValue(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="grid gap-2">
    <label :for="field.id" class="font-semibold">{{ field.label }}</label>
    <p class="text-xs text-[#FF0000]">Deseja excluir sua conta? Isso é permanente.</p>
    <div class="relative">
      <input
        :type="passwordVisible ? 'text' : 'password'"
        :id="field.id"
        :name="field.id"
        :placeholder="field.placeholder"
        :autocomplete="field.autocomplete"
        :value="modelValue"
        @input="updateValue"
        required
        class="w-full rounded-2xl border border-[#7AA6C8] px-3 py-3 text-sm text-black outline-none focus:bg-[#7AA6C8]/20 dark:text-[#999999]"
      />
      <span
        @click="togglePasswordVisibility"
        class="material-symbols-outlined absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#999999]"
      >
        {{ passwordVisible ? 'visibility_off' : 'visibility' }}
      </span>
    </div>
  </div>
</template>
