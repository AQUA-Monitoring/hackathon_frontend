<script setup lang="ts">
import { ref } from 'vue'

const expanded = ref(true)
</script>

<template>
  <div class="rounded-2xl border border-blue-200 bg-blue-50 text-sm text-blue-950 dark:border-blue-900 dark:bg-[#071F36] dark:text-blue-100">
    <div class="flex items-start gap-3 p-4">
      <span class="material-symbols-outlined mt-0.5 text-[#2768CA]" aria-hidden="true">info</span>
      <div class="min-w-0 flex-1">
        <p class="font-semibold">Como interpretar o impacto viário</p>
        <p v-show="expanded" id="flood-impact-help" class="mt-1 leading-relaxed">
          A tabela mostra interseções geométricas entre uma mancha e a malha viária de referência.
          Esse cálculo apoia priorização e inspeção, mas <strong>não confirma bloqueio, interdição ou
          condição atual da rua</strong>. Confirmação é uma ação humana separada e auditável.
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg px-2 py-1 font-semibold text-[#2768CA] hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA] dark:hover:bg-blue-950"
        :aria-expanded="expanded"
        aria-controls="flood-impact-help"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Dispensar' : 'Reabrir ajuda' }}
      </button>
    </div>
  </div>
</template>
