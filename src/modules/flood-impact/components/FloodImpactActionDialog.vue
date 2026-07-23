<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel: string
  tone?: 'primary' | 'danger'
  reasonLabel?: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [reason: string]
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const reason = ref('')
const reasonInput = ref<HTMLTextAreaElement | null>(null)

watch(() => props.open, async (open) => {
  if (open) {
    reason.value = ''
    await nextTick()
    dialog.value?.showModal()
    reasonInput.value?.focus()
  } else if (dialog.value?.open) {
    dialog.value.close()
  }
})

function submit() {
  const value = reason.value.trim()
  if (!value) {
    reasonInput.value?.focus()
    return
  }
  emit('confirm', value)
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[min(92vw,32rem)] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:bg-[#071F36] dark:text-white"
    @cancel.prevent="emit('close')"
    @close="emit('close')"
  >
    <form class="p-5" @submit.prevent="submit">
      <h2 class="text-lg font-semibold">{{ title }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{{ description }}</p>
      <label class="mt-4 block text-sm font-medium">
        {{ reasonLabel ?? 'Justificativa auditável' }}
        <textarea
          ref="reasonInput"
          v-model="reason"
          required
          rows="3"
          class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 focus:border-[#2768CA] focus:outline-none focus:ring-2 focus:ring-blue-200"
        ></textarea>
      </label>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="rounded-xl px-4 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800" @click="emit('close')">
          Cancelar
        </button>
        <button
          type="submit"
          class="rounded-xl px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          :class="tone === 'danger' ? 'bg-red-700 focus-visible:outline-red-700' : 'bg-[#2768CA] focus-visible:outline-[#2768CA]'"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </form>
  </dialog>
</template>
