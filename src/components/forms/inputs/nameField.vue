<script setup lang="ts">
import { type PropType, reactive, watch } from 'vue'

interface ISubField {
    id: string
    type: string
    placeholder?: string
    autocomplete?: string
}

interface INameField {
    fields: ISubField[]
    label: string
}

const props = defineProps({
    field: {
        type: Object as PropType<INameField>,
        required: true,
    },
    modelValue: {
        type: Object as PropType<Record<string, any>>,
        default: () => ({}),
    },
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: Record<string, any>): void
}>()

const values = reactive<Record<string, any>>({})

props.field.fields.forEach((f) => {
    values[f.id] = props.modelValue[f.id] ?? ''
})

watch(
    () => ({ ...values }),
    (val) => emit('update:modelValue', val),
    { deep: true },
)
</script>

<template>
    <div class="grid gap-2">
        <label>{{ field.label }}</label>
        <div class="flex gap-2">
            <input
                v-for="f in field.fields"
                :key="f.id"
                :type="f.type"
                :id="f.id"
                :name="f.id"
                :placeholder="f.placeholder"
                :autocomplete="f.autocomplete"
                v-model="values[f.id]"
                required
                class="w-[50%] rounded-lg border border-[#7AA6C8] px-3 py-3 text-xs text-black outline-none focus:bg-[#7AA6C8]/20 dark:text-[#999999]"
            />
        </div>
    </div>
</template>
