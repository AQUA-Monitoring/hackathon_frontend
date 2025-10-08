<script setup lang="ts">
import { reactive } from 'vue'
import {
    DatebornField,
    DeleteField,
    FieldGroup,
    NotificationField,
    NameField,
    PasswordField,
    PasswordProfileField,
    SelectField,
    TextareaField,
    TextField,
} from '@/@core/components'
import type { IFormField } from '@/@core/interfaces/form'

defineProps<{
    formFields: IFormField[]
    buttonText?: string
}>()
const emit = defineEmits<{
    (e: 'submit', values: Record<string, any>): void
}>()

const formData = reactive<Record<string, any>>({})

const getFieldComponent = (field: IFormField) => {
    switch (field.id) {
        case 'name':
            return NameField
        case 'password':
            return PasswordField
        case 'update-password':
            return PasswordProfileField
        case 'dateborn':
        case 'date':
            return DatebornField
        case 'delete':
            return DeleteField
        case 'type':
            return SelectField
        case 'description':
            return TextareaField
        case 'notification':
            return NotificationField
        default:
            return TextField
    }
}

function handleSubmit() {
    emit('submit', { ...formData })
}
</script>

<template>
    <form @submit.prevent="handleSubmit" class="mx-auto mt-5">
        <ul>
            <li
                v-for="field in formFields.filter(
                    (f) =>
                        ![
                            'rain',
                            'humidity',
                            'probability',
                            'duration',
                            'atmospheric_pressure',
                            'river_discharge',
                            'height',
                        ].includes(f.id),
                )"
                :key="field.id"
                class="my-1 grid"
                :class="field.id == 'notification' ? 'mx-auto w-[95%]' : 'w-[332px]'"
            >
                <component
                    :is="getFieldComponent(field)"
                    v-model="formData[field.id]"
                    :field="field"
                />
            </li>
            <li class="my-1 grid w-[332px]">
                <FieldGroup
                    :fields="formFields.filter((f) => ['rain', 'humidity'].includes(f.id))"
                    :modelValue="formData"
                    @update:modelValue="(v) => Object.assign(formData, v)"
                />
            </li>
            <li class="my-1 grid w-[332px]">
                <FieldGroup
                    :fields="formFields.filter((f) => ['probability', 'duration'].includes(f.id))"
                    :modelValue="formData"
                    @update:modelValue="(v) => Object.assign(formData, v)"
                />
            </li>
            <li class="my-1 grid w-[332px]">
                <FieldGroup
                    :fields="
                        formFields.filter((f) =>
                            ['atmospheric_pressure', 'river_discharge'].includes(f.id),
                        )
                    "
                    :modelValue="formData"
                    @update:modelValue="(v) => Object.assign(formData, v)"
                />
            </li>
            <li class="my-1 grid w-[332px]">
                <FieldGroup
                    :fields="formFields.filter((f) => ['height'].includes(f.id))"
                    :modelValue="formData"
                    @update:modelValue="(v) => Object.assign(formData, v)"
                />
            </li>
            <li class="my-3 grid w-[332px]">
                <FieldGroup
                    :fields="formFields.filter((f) => ['height'].includes(f.id))"
                    :modelValue="formData"
                    @update:modelValue="(v) => Object.assign(formData, v)"
                />
            </li>
        </ul>

        <button
            :class="
                formFields.some((f) => f.id === 'delete')
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
            "
            class="mx-auto block w-[250px] cursor-pointer rounded-2xl p-2 font-semibold text-white shadow-xl transition-colors duration-300"
            type="submit"
        >
            {{ buttonText }}
        </button>
    </form>
</template>
