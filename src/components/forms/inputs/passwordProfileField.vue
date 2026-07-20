<script setup lang="ts">
import { PasswordField } from '@/components'
import type { PropType } from 'vue'
import type { IFormField } from '@/types/form'

defineProps({
  field: {
    type: Object as PropType<IFormField>,
    required: true,
  },
})
</script>

<template>
  <div class="grid gap-2">
    <p class="font-semibold">{{ field.label }}</p>
    <PasswordField v-for="(childField, index) in field.fields" :key="index" :field="childField" />
  </div>
</template>
