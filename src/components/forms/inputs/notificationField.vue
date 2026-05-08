<script setup lang="ts">
import { type PropType, ref, watch } from 'vue'

interface INotificationOption {
  id: number
  alert: string
  message: string
  icon: string
  neighborhood: string
}

interface INotificationField {
  id: string
  label?: string
  options: INotificationOption[]
}

const props = defineProps({
  field: {
    type: Object as PropType<INotificationField>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<INotificationOption | null>,
    default: null,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: INotificationOption | null): void
}>()

const selected = ref<INotificationOption | null>(props.modelValue)

watch(selected, (val) => {
  emit('update:modelValue', val)
})
</script>

<template>
  <label v-for="notification in field.options" :key="notification.id" class="w-full">
    <input
      type="radio"
      :name="field.id"
      :value="notification"
      v-model="selected"
      class="peer hidden"
    />
    <div
      class="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border-2 border-transparent bg-[#F3F3F3] p-5 transition peer-checked:border-blue-600 dark:bg-[#00182F]"
    >
      <div class="w-[60%]">
        <h4 class="text-sm">{{ notification.alert }}</h4>
        <p class="text-xs lg:text-sm">{{ notification.message }}</p>
        <p class="mt-2 flex items-center gap-1 text-xs text-[#999999]">
          <span class="material-symbols-outlined">location_on</span>
          {{ notification.neighborhood }}
        </p>
      </div>
      <img :src="notification.icon" :alt="notification.alert" class="mr-3 h-8 w-8 object-cover" />
    </div>
  </label>
</template>
