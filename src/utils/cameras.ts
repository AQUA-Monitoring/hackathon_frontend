import { computed, onMounted } from 'vue'
import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'
import type { ICamera } from '@/types/camera'

const ctrl = useFloodCameraMonitoringStore()
const cams = computed<ICamera[]>(() => ctrl.camerasWithPrediction)

onMounted(async () => {
  await ctrl.load()
})

function displayFloodPercent(cam: ICamera): number {
  if (cam.prediction?.probabilities && typeof cam.prediction.probabilities.flooded === 'number') {
    const v = cam.prediction.probabilities.flooded
    const clamped = Math.min(100, Math.max(0, v))
    return Number(clamped.toFixed(2))
  }
  return cam.flood_percentage
}

export const orderedCams = computed(() => {
  return [...cams.value].sort((a, b) => {
    const aOnline = a.status === 'Online'
    const bOnline = b.status === 'Online'

    if (aOnline !== bOnline) return aOnline ? -1 : 1

    const aPct = displayFloodPercent(a)
    const bPct = displayFloodPercent(b)
    if (aPct !== bPct) return bPct - aPct

    return String(a.name || '').localeCompare(String(b.name || ''))
  })
})

// import { computed, onMounted } from 'vue'
// import { useFloodCameraMonitoringStore } from '@/stores/FloodCameraMonitoring'
// import type { ICamera } from '@/types/camera'

// export function useCameras() {
//   const ctrl = useFloodCameraMonitoringStore()
//   const cams = computed<ICamera[]>(() => ctrl.camerasWithPrediction)

//   onMounted(async () => {
//     await ctrl.load()
//   })

//   function displayFloodPercent(cam: ICamera): number {
//     if (cam.prediction?.probabilities && typeof cam.prediction.probabilities.flooded === 'number') {
//       const v = cam.prediction.probabilities.flooded
//       const clamped = Math.min(100, Math.max(0, v))
//       return Number(clamped.toFixed(2))
//     }
//     return cam.flood_percentage
//   }

//   const orderedCams = computed(() => {
//     return [...cams.value].sort((a, b) => {
//       const aOnline = a.status === 'Online'
//       const bOnline = b.status === 'Online'

//       if (aOnline !== bOnline) return aOnline ? -1 : 1

//       const aPct = displayFloodPercent(a)
//       const bPct = displayFloodPercent(b)
//       if (aPct !== bPct) return bPct - aPct

//       return String(a.name || '').localeCompare(String(b.name || ''))
//     })
//   })

//   return {
//     orderedCams,
//     loading: computed(() => ctrl.loading),
//     error: computed(() => ctrl.error),
//   }
// }
