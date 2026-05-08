<script setup lang="ts">
import { BaseForm } from '@/components'

const securityFields = [
  {
    id: 'name',
    label: 'Atualizar nome',
    fields: [
      {
        placeholder: 'Digite seu nome aqui',
        type: 'text',
        autocomplete: 'name',
      },
      {
        placeholder: 'Digite seu sobrenome aqui',
        type: 'text',
        autocomplete: 'name',
      },
    ],
    buttonText: 'Atualizar nome',
  },
]
</script>

<template>
  <section>
    <h1>Segurança</h1>

    <BaseForm
      v-for="(section, index) in securityFields"
      :key="index"
      :form-fields="[section]"
      :button-text="section.buttonText"
    />
  </section>
</template>
