<script setup lang="ts">
import { ref } from 'vue'
import { ButtonGlassmorphism } from '@/@core/components'
import { useRouter } from 'vue-router'

const router = useRouter()

const payForms = [
    { id: 1, icon: '/payment/card.svg', name: 'Cartão', route: '/pagamento/cartao' },
    { id: 2, icon: '/payment/pix.svg', name: 'Pix', route: '/pagamento/pix' },
    { id: 3, icon: '/payment/bank_slip.svg', name: 'Boleto', route: '/pagamento/boleto' },
]

const selected = ref<number | null>(null)

const finalize = () => {
    const form = payForms.find((f) => f.id === selected.value)
    if (form) {
        router.push(form.route)
    } else {
        alert('Por favor, selecione um método de pagamento.')
    }
}
</script>

<template>
    <h1 class="mb-10 hidden text-center text-2xl font-semibold lg:block">Doação</h1>
    <div class="grid justify-center">
        <div class="my-10 grid w-[332px] gap-5 lg:mt-30 lg:flex lg:justify-center lg:gap-10">
            <label v-for="form in payForms" :key="form.id" class="cursor-pointer">
                <input
                    type="radio"
                    name="method"
                    :value="form.id"
                    v-model="selected"
                    class="peer hidden"
                />
                <div
                    class="lg:py-auto flex justify-center gap-5 rounded-2xl border-2 border-transparent p-3 py-5 text-center shadow-lg transition peer-checked:border-blue-600 lg:grid lg:h-40 lg:w-40 lg:gap-0 lg:px-0 lg:shadow-xl dark:bg-[#00182F]"
                >
                    <img :src="form.icon" :alt="form.name" class="lg:mx-auto lg:my-auto" />
                    <p>{{ form.name }}</p>
                </div>
            </label>
        </div>
        <ButtonGlassmorphism buttonText="Pagar" @click="finalize" />
    </div>
</template>
