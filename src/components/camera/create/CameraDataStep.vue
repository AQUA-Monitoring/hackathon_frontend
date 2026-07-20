<script setup lang="ts">
import type { CameraCreateFormState } from '@/types/camera/cameraCreate'

defineProps<{
  form: CameraCreateFormState
}>()
</script>

<template>
  <div
    class="mx-auto mt-6 max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-700 dark:bg-[#00182F]"
  >
    <h2 class="text-xl font-semibold">2. Dados da câmera</h2>
    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
      As URLs são armazenadas somente após o envio. O formulário não tenta acessá-las.
    </p>

    <div class="mt-6 grid gap-5">
      <label class="grid gap-1 text-sm font-semibold">
        Descrição
        <input
          v-model="form.description"
          class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
          placeholder="Ex.: Câmera da Rua das Palmeiras"
        />
      </label>

      <label class="grid gap-1 text-sm font-semibold">
        URL HLS
        <input
          v-model="form.video_hls"
          type="url"
          class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
          placeholder="https://…/stream.m3u8"
          autocomplete="off"
        />
      </label>

      <label class="grid gap-1 text-sm font-semibold">
        URL de embed <span class="font-normal text-slate-500">(opcional)</span>
        <input
          v-model="form.video_embed"
          type="url"
          class="min-h-12 rounded-xl border border-slate-300 bg-transparent px-3 font-normal dark:border-slate-600"
          placeholder="https://…"
          autocomplete="off"
        />
      </label>
    </div>
  </div>
</template>
