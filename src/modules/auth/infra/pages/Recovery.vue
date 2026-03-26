<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { BaseForm, BasePopup } from '@/@core/components'
import { RecoveryCodeInput } from '../components'
import type { IFormField } from '@/@core/interfaces/form'

const router = useRouter()

const fields: IFormField[] = [
    { id: 'email', label: 'Email', placeholder: 'Digite seu email aqui', type: 'email' },
]
const recoveryCode = ref('')

const isCode = ref(false)
const waveDirection = computed<'left' | 'right'>(() => {
    return isCode.value ? 'left' : 'right'
})
function toggleWave() {
    isCode.value = !isCode.value
}

const showPopup = ref(false)
const closePopup = () => {
    showPopup.value = false
}
const contentPopup = ref({
    title: '',
    message: '',
    gif: '',
})
const success = ref(false)

function handleRecovery(values: Record<string, any>) {
    toggleWave()
}

function handleFinish(values: Record<string, any>) {
    success.value = true

    if (success.value) {
        contentPopup.value = {
            title: 'Sua conta foi recuperada!',
            message: 'Você será redirecionado para a sua conta.',
            gif: '/gifs/true.gif',
        }
        showPopup.value = true

        if (window.innerWidth >= 1024) {
            toast.success('Conta recuperada com sucesso!', {
                autoClose: 2000,
                position: 'top-right',
                theme: 'light',
            })
        }
        setTimeout(() => {
            router.push('/minha-conta/nicolefemello')
        }, 1000)
    } else {
        contentPopup.value = {
            title: 'Sua conta não foi recuperada!',
            message: 'Você será redirecionado para a página de inicial.',
            gif: '/gifs/false.gif',
        }
        showPopup.value = true

        if (window.innerWidth >= 1024) {
            toast.warn('Conta não recuperada!', {
                autoClose: 2000,
                position: 'top-right',
                theme: 'light',
            })
        }
        setTimeout(() => {
            router.push('/')
        }, 1500)
    }
}
</script>

<template>
    <div
        class="fixed inset-0 -z-10 hidden h-screen w-screen bg-contain bg-center transition-transform duration-1000 lg:block"
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
        <div
            v-if="!isCode"
            class="mt-30 grid justify-center lg:my-auto lg:mt-0 lg:flex lg:h-screen lg:items-center lg:justify-start lg:pl-50"
        >
            <div>
                <h1 class="hidden text-center text-2xl font-semibold lg:block">Recuperação</h1>
                <BaseForm :form-fields="fields" button-text="Continuar" @submit="handleRecovery" />
            </div>
        </div>

        <div
            v-else
            class="mt-30 grid justify-center lg:my-auto lg:mt-0 lg:flex lg:h-screen lg:items-center lg:justify-end lg:pr-50"
        >
            <div>
                <h1 class="hidden text-center text-2xl font-semibold lg:block">Recuperação</h1>
                <RecoveryCodeInput
                    v-model="recoveryCode"
                    :code-length="6"
                    button-text="Confirmar"
                    @submit="handleFinish"
                />
                <BasePopup
                    :title="contentPopup.title"
                    :text="contentPopup.message"
                    :gifUrl="contentPopup.gif"
                    :showPopup="showPopup"
                    @close="closePopup"
                    class="lg:hidden"
                />
            </div>
        </div>
    </Transition>
</template>
