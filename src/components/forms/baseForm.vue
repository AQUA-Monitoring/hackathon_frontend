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
  title: {
    type: String,
    required: false,
  },

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

  isAuthForm: {
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
      formData[field.id] = field.type === 'file' ? null : ''
    }
  })
})

const getFieldComponent = (field: IField) => {
  switch (field.type) {
    case 'password':
      return PasswordField

    case 'dateborn':
      return DatebornField

    case 'date':
      return DateField

    case 'select':
      return SelectField

    case 'file':
      return FileField

    case 'textarea':
      return TextareaField

    case 'text':
    case 'email':
    case 'number':
    default:
      return TextField
  }
}

function handleSubmit() {
  emit('submit', { ...formData })
}
</script>

<template>
  <h1 class="font-semibold text-2xl text-center mb-5">{{ title }}</h1>

  <form @submit.prevent="handleSubmit" class="flex flex-col w-[80vw] md:w-[60vw] lg:w-[20vw]">
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
        :is-auth="isAuthForm"
      />
    </div>
  </form>
</template>
