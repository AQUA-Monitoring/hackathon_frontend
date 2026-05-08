<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { AuthLogin, AuthRegister } from '@/components'
import type { IFormField } from '@/types/form'
// import { useAuthController } from '@/modules/auth/controllers/AuthController'

const route = useRoute()
const router = useRouter()
// const auth = useAuthController()

const isLogin = ref(route.query.mode !== 'register')

const loginFields: IFormField[] = [
  { id: 'email', label: 'Email', placeholder: 'Digite seu email aqui', type: 'email' },
  { id: 'password', label: 'Senha', placeholder: 'Digite sua senha aqui', type: 'password' },
]
const registerFields: IFormField[] = [
  {
    id: 'name',
    label: 'Nome',
    placeholder: 'Digite seu nome aqui',
    type: 'text',
    autocomplete: 'name',
  },
  {
    id: 'email',
    label: 'Email',
    placeholder: 'Digite seu email aqui',
    type: 'email',
    autocomplete: 'email',
  },
  {
    id: 'dateborn',
    label: 'Data de nascimento',
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
  {
    id: 'password',
    label: 'Senha',
    placeholder: 'Digite sua senha aqui',
    type: 'password',
    autocomplete: 'new-password',
  },
  {
    id: 'password-confirm',
    label: 'Confirme sua Senha',
    placeholder: 'Repita sua senha aqui',
    type: 'password',
    autocomplete: 'new-password',
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
    // await auth.login({ email: values.email, password: values.password })
    toast.success('Login realizado com sucesso!', { autoClose: 2000 })
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
    class="fixed -z-10 h-screen inset-0 w-screen bg-contain bg-center bg-no-repeat transition-transform duration-1000 lg:block"
    :class="{
      'translate-x-[40%]': waveDirection === 'right',
      'translate-x-[-40%]': waveDirection === 'left',
    }"
    style="background-image: url('/layouts/new-wavesAuth.svg')"
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
