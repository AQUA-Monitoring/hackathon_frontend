<script setup lang="ts">
import type { CameraCreateStep } from '@/types/cameraCreate'

defineProps<{
  currentStep: CameraCreateStep
  submitting: boolean
}>()

const emit = defineEmits<{
  previous: []
  next: []
  submit: []
}>()
</script>

<template>
  <div v-if="currentStep < 4" class="mt-6 flex items-center justify-between gap-3 pb-10">
    <button
      type="button"
      class="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold disabled:opacity-40 dark:border-slate-600"
      :disabled="currentStep === 1"
      @click="emit('previous')"
    >
      Voltar
    </button>

    <button
      v-if="currentStep === 1"
      type="button"
      class="min-h-12 rounded-xl bg-[#2768CA] px-6 font-semibold text-white"
      @click="emit('next')"
    >
      Continuar
    </button>

    <button
      v-else-if="currentStep === 2"
      type="button"
      class="min-h-12 rounded-xl bg-[#2768CA] px-6 font-semibold text-white"
      @click="emit('next')"
    >
      Revisar
    </button>

    <button
      v-else
      type="button"
      class="min-h-12 rounded-xl bg-[#2768CA] px-6 font-semibold text-white disabled:opacity-60"
      :disabled="submitting"
      @click="emit('submit')"
    >
      {{ submitting ? 'Cadastrando...' : 'Cadastrar câmera' }}
    </button>
  </div>
</template>
