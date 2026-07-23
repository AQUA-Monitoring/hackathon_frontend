<script setup lang="ts">
defineProps<{ mode: 'hidden' | 'camera' | 'context' }>()
</script>

<template>
  <div
    v-if="mode !== 'hidden'"
    class="pointer-events-none absolute inset-x-3 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] z-30 md:hidden"
  >
    <Transition name="map-context" mode="out-in">
      <div :key="mode" class="pointer-events-auto">
        <slot :name="mode"></slot>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.map-context-enter-active,
.map-context-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}
.map-context-enter-from,
.map-context-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}
@media (prefers-reduced-motion: reduce) {
  .map-context-enter-active,
  .map-context-leave-active {
    transition: none;
  }
}
</style>
