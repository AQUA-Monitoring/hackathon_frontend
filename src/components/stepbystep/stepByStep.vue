<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, type PropType } from 'vue'
import { BaseButton } from '@/components'

const props = defineProps({
  totalSteps: {
    type: Number,
    required: true,
  },
  finishButtonText: {
    type: String,
    default: 'Finalizar',
  },
  onNext: {
    type: Function as PropType<(step: number) => boolean | Promise<boolean> | void>,
    default: null,
  },
  buttonLabels: {
    type: Object as PropType<Record<number, string>>,
    default: () => ({}),
  },
})

const emit = defineEmits(['finish'])
const currentStep = ref<number>(1)

const nextStep = (): void => {
  if (currentStep.value < props.totalSteps) currentStep.value++
}

const finish = (): void => {
  currentStep.value++
  emit('finish')
}

const buttonText = computed(() => {
  const customLabel = props.buttonLabels[currentStep.value]

  if (customLabel) return customLabel

  return currentStep.value < props.totalSteps ? 'Continuar' : props.finishButtonText
})

const handleButtonClick = async (): Promise<void> => {
  if (currentStep.value < props.totalSteps) {
    const shouldAdvance = props.onNext ? await props.onNext(currentStep.value) : true
    if (shouldAdvance !== false) nextStep()
    return
  }

  finish()
}

const handleKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    await handleButtonClick()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="grid justify-center">
    <div class="flex justify-center gap-10">
      <div v-for="step in totalSteps" :key="step" class="flex items-center">
        <div
          class="flex items-center justify-center rounded-full transition-all duration-300"
          :class="{
            'h-7 w-7 bg-blue-500': currentStep === step,
            'h-5 w-5 bg-gray-300 dark:bg-gray-600': currentStep !== step,
            'border-4 border-blue-200 dark:border-blue-800': currentStep === step,
          }"
        ></div>
        <div
          v-if="step < totalSteps"
          class="transition-width flex-auto border-t-2 duration-500 ease-in-out"
          :class="step < currentStep ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'"
        ></div>
      </div>
    </div>

    <div class="mt-10 mb-5 min-h-37.5">
      <template v-for="step in totalSteps" :key="step">
        <div v-if="currentStep === step">
          <slot :name="`step-${step}`"></slot>
        </div>
      </template>

      <div v-if="currentStep > totalSteps">
        <h2 class="mb-4 text-xl font-semibold text-green-500">Concluído!</h2>
        <p class="text-gray-600 dark:text-gray-400">Processo finalizado com sucesso.</p>
      </div>
    </div>

    <BaseButton
      @click="handleButtonClick"
      is-auth
      :button-text="buttonText"
    />
  </div>
</template>
