<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    activeCount?: number
    busy?: boolean
    filtersClass?: string
  }>(),
  { activeCount: 0, busy: false, filtersClass: '' },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: []
  clear: []
}>()
</script>

<template>
  <div
    class="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-[#001C3B]"
  >
    <form class="flex flex-col gap-3 sm:flex-row" role="search" @submit.prevent="emit('apply')">
      <div class="min-w-0 flex-1">
        <slot name="search" />
      </div>
      <button type="button"
        class="relative min-h-12 rounded-2xl border border-slate-300 px-5 font-semibold transition hover:border-[#2768CA] focus-visible:outline-3 focus-visible:outline-[#2768CA] dark:border-slate-600"
        :aria-expanded="open" @click="emit('update:open', !open)">
        Filtros
        <span v-if="activeCount" class="ml-2 rounded-full bg-[#2768CA] px-2 py-0.5 text-xs text-white"
          :aria-label="`${activeCount} filtros ativos`">{{ activeCount }}</span>
      </button>
      <button type="submit"
        class="min-h-12 rounded-2xl bg-[#2768CA] px-5 font-semibold text-white transition hover:bg-[#1F57AD] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA] disabled:opacity-60"
        :disabled="busy">
        {{ busy ? 'Aplicando…' : 'Buscar' }}
      </button>
    </form>

    <div
      v-if="open"
      class="mt-3 border-t border-slate-100 pt-4 dark:border-slate-800"
    >
      <div :class="filtersClass">
        <slot />
      </div>
      <div class="mt-4 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          class="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 underline focus-visible:outline-3 focus-visible:outline-[#2768CA] dark:text-slate-300"
          :disabled="busy"
          @click="emit('clear')"
        >
          Limpar filtros
        </button>
        <button
          type="button"
          class="min-h-11 rounded-xl bg-[#2768CA] px-5 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#2768CA] disabled:opacity-60"
          :disabled="busy"
          @click="emit('apply')"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  </div>
</template>
