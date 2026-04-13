<script setup lang="ts">
const emit = defineEmits(['close'])

const closePopup = () => {
    emit('close')
}

const handleOverlayClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).id === 'overlay') {
        emit('close')
    }
}
</script>

<template>
    <div
        id="overlay"
        class="fixed inset-0 z-20 flex items-center justify-center bg-black/80"
        @click="handleOverlayClick"
    >
        <div
            class="flex max-h-[90vh] w-[90%] max-w-md flex-col overflow-y-auto rounded-lg bg-white pt-4 pb-7 shadow-lg dark:bg-[#000d19]"
        >
            <div class="flex justify-between px-5">
                <button
                    class="text-2xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    @click="closePopup"
                >
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
            </div>

            <div
                class="grid items-center justify-center gap-4 px-10 pt-3 pb-5 text-center font-semibold text-gray-900 lg:text-lg dark:text-white"
            >
                <h2>Baixe nosso app e tenha a melhor experiência com o Aqua!</h2>

                <img src="/icons/logo.svg" alt="Aqua" class="mx-auto mt-5 rounded-3xl shadow-lg" />
                <a
                    href="/Aqua.apk"
                    download
                    class="mx-auto mb-5 flex items-center gap-1 rounded-2xl bg-blue-500 px-10 py-2 text-base font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-blue-600"
                >
                    Baixe o nosso App
                    <span class="material-symbols-outlined">download</span>
                </a>

                <p>Tudo o que você já gosta no nosso site, agora na palma da sua mão!</p>
            </div>
        </div>
    </div>
</template>
