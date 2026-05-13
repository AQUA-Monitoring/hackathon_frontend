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
  BaseButton,
} from '@/components'

import type { IFormField, IField } from '@/types/form'

const props = defineProps({
  formFields: {
    type: Array as PropType<IFormField[]>,
    required: true,
  },

  buttonText: {
    type: String,
    required: false,
  },

  isDeleteButton: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'submit', values: Record<string, any>): void
}>()

const formData = reactive<Record<string, any>>({})

props.formFields.forEach((section) => {
  section.fields.forEach((field) => {
    if (field.id) {
      formData[field.id] = ''
    }
  })
})

const getFieldComponent = (field: IField) => {
  switch (field.id) {
    case 'password':
    case 'new-password':
    case 'password-confirm':
      return PasswordField

    case 'text':
    case 'email':
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
  <form @submit.prevent="handleSubmit" class="mt-10 flex flex-col w-[20vw]">
    <div v-for="section in formFields" :key="section.id" class="mb-5">
      <h2 class="text-lg font-semibold">
        {{ section.label }}
      </h2>

      <ul class="space-y-5">
        <li v-for="field in section.fields" :key="field.id">
          <component
            :is="getFieldComponent(field)"
            v-model="formData[field.id || '']"
            :field="field"
          />
        </li>
      </ul>
    </div>

    <div class="mx-auto">
      <BaseButton
        v-if="buttonText"
        :button-text="buttonText"
        type="submit"
        :is-delete="isDeleteButton"
      />
    </div>
  </form>
</template>
