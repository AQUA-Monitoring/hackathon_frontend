<script setup lang="ts">
import { type PropType, reactive, watch } from 'vue'
import type { IField } from '@/types/form'

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

const dateParts = reactive({
  day: '',
  month: '',
  year: '',
})

if (props.modelValue) {
  const [year, month, day] = props.modelValue.split('-')
  dateParts.day = day ?? ''
  dateParts.month = month ?? ''
  dateParts.year = year ?? ''
}

watch(
  () => ({ ...dateParts }),
  (val) => {
    if (val.day && val.month && val.year) {
      emit(
        'update:modelValue',
        `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`,
      )
    } else {
      emit('update:modelValue', '')
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="grid gap-2">
    <label class="font-semibold">{{ field.label }}</label>
    <div class="flex justify-between gap-2">
      <select
        v-model="dateParts.day"
        name="day"
        id="day"
        class="w-[32%] rounded-2xl border border-[#7AA6C8] px-3 py-2 text-sm text-[#999999] outline-none"
      >
        <option value="">Dia</option>
        <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
      </select>

      <select
        v-model="dateParts.month"
        name="month"
        id="month"
        class="w-[32%] rounded-2xl border border-[#7AA6C8] px-3 py-2 text-sm text-[#999999] outline-none"
      >
        <option value="">Mês</option>
        <option v-for="(option, index) in field.options" :key="option" :value="index + 1">
          {{ option }}
        </option>
      </select>

      <select
        v-model="dateParts.year"
        name="year"
        id="year"
        class="w-[32%] rounded-2xl border border-[#7AA6C8] px-3 py-2 text-sm text-[#999999] outline-none"
      >
        <option value="">Ano</option>
        <option v-for="year in 100" :key="year" :value="new Date().getFullYear() - year + 1">
          {{ new Date().getFullYear() - year + 1 }}
        </option>
      </select>
    </div>
  </div>
</template>
