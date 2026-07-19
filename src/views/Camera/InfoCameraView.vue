<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CameraInspectionPanel } from '@/components'
import { useCamerasMonitoring } from '@/composables/useCamerasMonitoring'
import type { CameraApiItem } from '@/types/camera/camera'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { getById } = useCamerasMonitoring({ autoLoad: false })
const camera = ref<CameraApiItem | null>(null)
const loading = ref(true)

onMounted(async () => {
  camera.value = await getById(props.id)
  loading.value = false
})

function close() {
  router.push('/cameras')
}
</script>

<template>
  <main class="mx-auto w-full max-w-6xl px-4 py-5 lg:px-8">
    <div v-if="loading" class="grid min-h-64 place-items-center text-slate-500" role="status">
      Carregando detalhes da câmera...
    </div>
    <CameraInspectionPanel v-else-if="camera" :camera="camera" @close="close" />
    <div v-else class="grid min-h-64 place-items-center text-center">
      <div>
        <h1 class="text-2xl font-semibold">Câmera não encontrada</h1>
        <p class="mt-2 text-slate-600">A câmera solicitada não está disponível.</p>
        <button class="mt-5 rounded-xl bg-[#2768CA] px-5 py-3 font-semibold text-white" @click="close">
          Voltar para câmeras
        </button>
      </div>
    </div>
  </main>
</template>
