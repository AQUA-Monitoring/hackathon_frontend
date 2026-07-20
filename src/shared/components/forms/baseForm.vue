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
  FieldGroup,
} from '@/shared'

import type { IFormField, IField } from '@/shared'

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
  (e: 'submit', values: Record<string, string | number | null | undefined>): void
}>()

const formData = reactive<Record<string, string | number | null | undefined>>({})

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
    case 'group':
      return FieldGroup
    case 'text':
    case 'email':
    case 'number':
    default:
      return TextField
  }
}

function submitForm() {
  const values = { ...formData }
  emit('submit', values)
  return values
}

defineExpose({ submitForm })
</script>

<template>
  <h1 class="font-semibold text-2xl text-center mb-5">{{ title }}</h1>

  <form @submit.prevent="submitForm" class="flex flex-col w-[80vw] md:w-[60vw] lg:w-[20vw]">
    <div v-for="section in formFields" :key="section.id" class="mb-5">
      <h2 class="text-lg font-semibold">
        {{ section.label }}
      </h2>
      <p v-if="section.fields[0]?.message" class="text-xs text-[#999999]">
        {{ section.fields[0].message }}
      </p>

      <ul class="space-y-5">
        <li v-for="field in section.fields" :key="field.id">
          <FieldGroup v-if="field.type === 'group'">
            <component
              v-for="childField in field.fields"
              :key="childField.id"
              :is="getFieldComponent(childField)"
              v-model="formData[childField.id || '']"
              :field="childField"
            />
          </FieldGroup>

          <component
            v-else
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
