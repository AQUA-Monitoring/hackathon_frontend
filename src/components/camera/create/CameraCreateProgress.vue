<script setup lang="ts">
import type { CameraCreateStep } from '@/types/cameraCreate'

const props = defineProps<{
  currentStep: CameraCreateStep
}>()

const emit = defineEmits<{
  navigate: [step: 1 | 2 | 3]
}>()

function navigate(step: number) {
  if (step >= props.currentStep || step === 4) return
  emit('navigate', step as 1 | 2 | 3)
}
</script>

<template>
  <ol class="mt-6 grid grid-cols-4 gap-2" aria-label="Etapas do cadastro">
    <li v-for="step in 4" :key="step">
      <button
        type="button"
        class="flex w-full items-center gap-2 text-left"
        :disabled="step === 4 || step > currentStep"
        :aria-current="currentStep === step ? 'step' : undefined"
        @click="navigate(step)"
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold"
          :class="
            currentStep >= step
              ? 'bg-[#2768CA] text-white'
              : 'bg-slate-100 text-slate-500 dark:bg-[#071F36]'
          "
        >
          <span v-if="currentStep > step" class="material-symbols-outlined text-lg">
            check
          </span>
          <span v-else>{{ step }}</span>
        </span>

        <span class="hidden text-xs font-semibold sm:block">
          {{
            step === 1
              ? 'Localização'
              : step === 2
                ? 'Dados'
                : step === 3
                  ? 'Revisão'
                  : 'Conclusão'
          }}
        </span>
      </button>

      <div class="mt-2 h-1 rounded-full bg-slate-100 dark:bg-[#071F36]">
        <div v-if="currentStep >= step" class="h-full rounded-full bg-[#2768CA]"></div>
      </div>
    </li>
  </ol>
</template>
