<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { AuthLogin, AuthRegister } from '@/components'
import type { IFormField } from '@/types/form'
import { useScreenSize } from '@/composables/screenSize'
// import { useAuthController } from '@/modules/auth/controllers/AuthController'x
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
// const auth = useAuthController()
const { isDesktop } = useScreenSize()

const isLogin = ref(route.query.mode !== 'register')

const loginFields: IFormField[] = [
  {
    id: 'email',
    label: 'Email',
    fields: [
      {
        id: 'email',
        placeholder: 'Digite seu email aqui',
        type: 'email',
      },
    ],
  },
  {
    id: 'password',
    label: 'Senha',
    fields: [
      {
        id: 'password',
        placeholder: 'Digite sua senha aqui',
        type: 'password',
      },
    ],
  },
]
const registerFields: IFormField[] = [
  {
    id: 'name',
    label: 'Nome',
    fields: [
      {
        placeholder: 'Digite seu nome aqui',
        type: 'text',
        autocomplete: 'name',
      },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    fields: [
      {
        id: 'email',
        placeholder: 'Digite seu email aqui',
        type: 'email',
        autocomplete: 'email',
      },
    ],
  },
  {
    id: 'dateborn',
    label: 'Data de nascimento',
    fields: [
      {
        id: 'dateborn',
        type: 'date',
        name: 'Mês',
        options: [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ],
      },
    ],
  },
  {
    id: 'password',
    label: 'Senha',
    fields: [
      {
        id: 'password',
        placeholder: 'Digite sua senha aqui',
        type: 'password',
        autocomplete: 'new-password',
      },
    ],
  },
  {
    id: 'password-confirm',
    label: 'Confirme sua Senha',
    fields: [
      {
        id: 'password',
        placeholder: 'Repita sua senha aqui',
        type: 'password',
        autocomplete: 'new-password',
      },
    ],
  },
]

const waveDirection = computed<'left' | 'right'>(() => {
  return isLogin.value ? 'right' : 'left'
})
function toggleWave() {
  isLogin.value = !isLogin.value
}

async function handleLogin(values: Record<string, any>) {
  try {
    await authStore.loginUser({ email: values.email, password: values.password })
    router.push('/')
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao realizar login')
  }
}
async function handleRegister(values: Record<string, any>) {
  try {
    // await auth.register({
    //   name: values.name,
    //   email: values.email,
    //   dateborn: values.dateborn,
    //   password: values.password,
    //   'password-confirm': values['password-confirm'],
    // })
    toast.success('Cadastro realizado com sucesso!', { autoClose: 2000 })
    isLogin.value = true
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao realizar cadastro')
  }
}
</script>

<template>
  <div
    v-if="isDesktop"
    class="fixed -z-10 h-screen inset-0 w-screen bg-contain bg-center bg-no-repeat transition-transform duration-1000 hidden lg:block"
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
    :class="[!isDesktop ? 'flex flex-col items-center justify-center' : '']"
  >
    <AuthLogin
      v-if="isLogin"
      :login-fields="loginFields"
      @submit="handleLogin"
      @toggle="toggleWave"
    />

    <AuthRegister
      v-else
      :register-fields="registerFields"
      @submit="handleRegister"
      @toggle="toggleWave"
    />
  </Transition>
</template>
