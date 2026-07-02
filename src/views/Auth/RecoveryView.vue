<script setup lang="ts">
import { ref, computed } from 'vue'
import { RecoveryEmail, RecoveryCode } from '@/components'
import type { IFormField } from '@/types/form'
import { useScreenSize } from '@/composables/screenSize'

const { isDesktop } = useScreenSize()

const recoveryFields: IFormField[] = [
  {
    id: 'email',
    label: 'Email',
    fields: [
      {
        id: 'email',
        placeholder: 'Digite seu email aqui',
        type: 'email',
      },
    ],
  },
]

const isCode = ref<boolean>(false)

const waveDirection = computed<'left' | 'right'>(() => {
  return isCode.value ? 'right' : 'left'
})

function toggleWave() {
  isCode.value = !isCode.value
}
</script>

<template>
  <div
    v-if="isDesktop"
    class="fixed -z-10 h-screen inset-0 w-screen bg-contain bg-center bg-no-repeat transition-transform duration-1000 hidden lg:block"
    :class="{
      'translate-x-[40%]': waveDirection === 'right',
      'translate-x-[-40%]': waveDirection === 'left',
    }"
    style="background-image: url('/layouts/wavesAuth.svg')"
  ></div>

  <Transition
    mode="out-in"
    enter-active-class="transition duration-500 ease-out"
    leave-active-class="transition duration-500 ease-in"
    enter-from-class="opacity-0 translate-x-10"
    enter-to-class="opacity-100 translate-x-0"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 -translate-x-10"
  >
    <RecoveryEmail v-if="!isCode" :recovery-fields="recoveryFields" @toggle="toggleWave" />

    <RecoveryCode v-else />
  </Transition>
</template>
