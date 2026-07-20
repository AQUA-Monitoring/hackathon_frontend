<script setup lang="ts">
import type { CityDto, NeighborhoodDto } from '@/types/camera/camera'
import type { CameraCreateFormState } from '@/types/camera/cameraCreate'

defineProps<{
  form: CameraCreateFormState
  selectedCity: CityDto | null
  selectedNeighborhood: NeighborhoodDto | null
}>()
</script>

<template>
  <div
    class="mx-auto mt-6 max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-700 dark:bg-[#00182F]"
  >
    <h2 class="text-xl font-semibold">3. Revise antes de cadastrar</h2>

    <div
      class="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
    >
      <strong>Criação inativa:</strong> a câmera não será ativada nem analisada automaticamente.
      Uma validação operacional posterior será necessária.
    </div>

    <dl class="mt-6 grid gap-4 text-sm sm:grid-cols-2">
      <div>
        <dt class="text-slate-500">Câmera</dt>
        <dd class="font-semibold">{{ form.description }}</dd>
      </div>

      <div>
        <dt class="text-slate-500">Cidade e bairro</dt>
        <dd class="font-semibold">
          {{ selectedCity?.name }} · {{ selectedNeighborhood?.name }}
        </dd>
      </div>

      <div>
        <dt class="text-slate-500">Endereço</dt>
        <dd class="font-semibold">
          {{ form.street }}<span v-if="form.number">, {{ form.number }}</span>
        </dd>
      </div>

      <div>
        <dt class="text-slate-500">Coordenadas</dt>
        <dd class="font-semibold">{{ form.latitude }}, {{ form.longitude }}</dd>
      </div>

      <div class="sm:col-span-2">
        <dt class="text-slate-500">HLS</dt>
        <dd class="break-all font-semibold">{{ form.video_hls }}</dd>
      </div>

      <div v-if="form.video_embed" class="sm:col-span-2">
        <dt class="text-slate-500">Embed</dt>
        <dd class="break-all font-semibold">{{ form.video_embed }}</dd>
      </div>
    </dl>
  </div>
</template>
