<script setup lang="ts">
import { type PropType, reactive } from 'vue'
import {
  DatebornField,
  DateField,
  FileField,
  PasswordField,
  SelectField,
  TextareaField,
  TextField,
  ButtonGlassmorphism,
} from '@/components'
import type { IFormField } from '@/types/form'

const props = defineProps({
  formFields: {
    type: Array as PropType<IFormField[]>,
    required: true,
  },
  buttonText: {
    type: String,
    required: false,
  },
})

const emit = defineEmits<{
  (e: 'submit', values: Record<string, any>): void
}>()

const formData = reactive<Record<string, any>>({})

props.formFields.forEach((field) => {
  formData[field.id] = ''
})

const getFieldComponent = (field: IFormField) => {
  switch (field.id) {
    case 'password':
    case 'password-confirm':
      return PasswordField
    case 'text':
      return TextField
    case 'dateborn':
      return DatebornField
    case 'date':
      return DateField
    case 'bank':
    case 'category':
    case 'state':
      return SelectField
    case 'file':
      return FileField
    case 'description':
      return TextareaField
    default:
      return TextField
  }
}

function handleSubmit() {
  emit('submit', { ...formData })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="mt-5">
    <ul>
      <li v-for="field in formFields" :key="field.id" class="my-5 grid w-83">
        <component :is="getFieldComponent(field)" v-model="formData[field.id]" :field="field" />
      </li>
    </ul>

    <ButtonGlassmorphism v-if="buttonText" :buttonText="buttonText" type="submit" />
  </form>
</template>
