<script setup lang="ts">
import { BaseForm, MapboxComp } from '@/components'
import type { IFormField } from '@/types/form'

const registerPointsFields: IFormField[] = [
  {
    id: 'latitude',
    label: 'Latitude',
    fields: [
      {
        id: 'latitude',
        placeholder: 'Digite a latitude aqui',
        type: 'number',
      },
    ],
  },
  {
    id: 'longitude',
    label: 'Longitude',
    fields: [
      {
        id: 'longitude',
        placeholder: 'Digite a longitude aqui',
        type: 'number',
      },
    ],
  },
  {
    id: 'city',
    label: 'Cidade',
    fields: [
      {
        id: 'city',
        placeholder: 'Digite a cidade aqui',
        type: 'text',
      },
    ],
  },
  {
    id: 'neighborhood',
    label: 'Bairro',
    fields: [
      {
        id: 'neighborhood',
        placeholder: 'Digite a bairro aqui',
        type: 'text',
      },
    ],
  },
  {
    id: 'rain_humidity',
    fields: [
      {
        type: 'group',
        fields: [
          {
            id: 'rain',
            label: 'Chuva',
            placeholder: 'xxx',
            type: 'number',
          },
          {
            id: 'humidity',
            label: 'Umidade',
            placeholder: 'xxx',
            type: 'number',
          },
        ],
      },
    ],
  },
  {
    id: 'probability_duration',
    fields: [
      {
        type: 'group',
        fields: [
          {
            id: 'probability',
            label: 'Probabilidade',
            placeholder: '000',
            type: 'number',
          },
          {
            id: 'duration',
            label: 'Duração',
            placeholder: '000',
            type: 'number',
          },
        ],
      },
    ],
  },

  {
    id: 'pressure_riverFlow',
    fields: [
      {
        type: 'group',
        fields: [
          {
            id: 'pressure',
            label: 'Pressão',
            placeholder: '000',
            type: 'number',
          },
          {
            id: 'river_flow',
            label: 'Vazão do rio',
            placeholder: '000',
            type: 'number',
          },
        ],
      },
    ],
  },
]
</script>

<template>
  <section class="flex justify-between gap-10 w-full mt-5">
    <div class="w-[40vw] grid justify-center py-5 border border-[#DCDCDC] rounded-4xl">
      <h1 class="font-semibold text-3xl">Cadastrar novo ponto</h1>

      <BaseForm :form-fields="registerPointsFields" button-text="Cadastrar" />
    </div>

    <MapboxComp />
  </section>
</template>
