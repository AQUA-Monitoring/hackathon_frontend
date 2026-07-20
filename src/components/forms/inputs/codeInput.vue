<script setup lang="ts">
import { ref, reactive, nextTick, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  codeLength: {
    type: Number,
    default: 6,
  },
  buttonText: {
    type: String,
    required: false,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | boolean | null): void
  (e: 'submit', values: Record<string, string>): void
}>()

const code = reactive<string[]>(Array(props.codeLength).fill(''))
const inputRefs = ref<HTMLInputElement[]>([])
const formData = reactive<Record<string, string>>({})

// Atualiza quando já existe valor inicial
if (props.modelValue) {
  props.modelValue.split('').forEach((char, i) => {
    if (i < props.codeLength) code[i] = char
  })
}

// Mantém sincronizado se modelValue mudar externamente
watch(
  () => props.modelValue,
  (newVal) => {
    code.fill('')
    newVal.split('').forEach((char, i) => {
      if (i < props.codeLength) code[i] = char
    })
  },
)

const updateCode = () => {
  emit('update:modelValue', code.join(''))
}
function handleSubmit() {
  emit('submit', { ...formData })
}

const handleInput = (e: Event, index: number) => {
  const input = e.target as HTMLInputElement
  const value = input.value.slice(0, 1)

  code[index] = value
  updateCode()

  if (value && index < props.codeLength - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handleKeydown = (e: KeyboardEvent, index: number) => {
  if (e.key === 'Backspace' && !code[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
  if (e.key === 'ArrowLeft' && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
  if (e.key === 'ArrowRight' && index < props.codeLength - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const pastedData = e.clipboardData?.getData('text').trim()

  if (!pastedData || !/^\d+$/.test(pastedData)) return

  for (let i = 0; i < props.codeLength; i++) {
    code[i] = i < pastedData.length ? (pastedData[i] ?? '') : ''
  }

  updateCode()

  const focusIndex = Math.min(pastedData.length, props.codeLength - 1)
  nextTick(() => {
    inputRefs.value[focusIndex]?.focus()
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="mt-10 mb-5 flex justify-center gap-2">
      <template v-for="(_, index) in codeLength" :key="index">
        <input
          :ref="
            (el) => {
              if (el) inputRefs[index] = el as HTMLInputElement
            }
          "
          v-model="code[index]"
          type="text"
          maxlength="1"
          pattern="\d*"
          inputmode="numeric"
          placeholder="-"
          class="h-14 w-12 rounded-lg border-2 border-gray-400 bg-gray-300 text-center text-2xl text-gray-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:focus:bg-gray-900"
          @input="handleInput($event, index)"
          @keydown="handleKeydown($event, index)"
          @paste="handlePaste"
        />
      </template>
    </div>
  </form>
</template>
