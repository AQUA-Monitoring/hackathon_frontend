<script setup lang="ts">
import type { CameraDetail, ViewMode } from '../types/camera'

defineProps<{
  cam: CameraDetail
  modelValue?: ViewMode | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ViewMode]
}>()
</script>

<template>
  <div class="flex shrink-0 gap-1">
    <button
      type="button"
      class="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-slate-300 dark:ring-slate-600"
      :class="
        modelValue === 'embed'
          ? 'bg-emerald-600 text-white ring-emerald-600'
          : 'bg-transparent text-slate-600 dark:text-slate-300'
      "
      :disabled="!cam.embedUrl"
      title="Realtime (Embed)"
      @click="emit('update:modelValue', 'embed')"
    >
      Realtime
    </button>

    <button
      type="button"
      class="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-slate-300 dark:ring-slate-600"
      :class="
        modelValue === 'hls'
          ? 'bg-blue-500 text-white ring-blue-600'
          : 'bg-transparent text-slate-600 dark:text-slate-300'
      "
      title="HLS"
      :disabled="!cam.hlsUrl"
      @click="emit('update:modelValue', 'hls')"
    >
      HLS
    </button>
  </div>
</template>
