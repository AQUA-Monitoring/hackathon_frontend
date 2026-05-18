<script setup lang="ts">
import { PasswordField } from '@/components'

defineProps({
  field: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="grid gap-2">
    <p class="font-semibold">{{ field.label }}</p>
    <PasswordField v-for="(field, index) in field.fields" :key="index" :field="field" />
  </div>
</template>
