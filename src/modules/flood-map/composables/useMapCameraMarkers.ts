import { shallowRef } from 'vue'
import mapboxgl from 'mapbox-gl'
import router from '@/app/router'
import { cameraCoordinates } from '@/modules/cameras'
import { isInsideAquaTerritory } from '@/shared'
import type { useFloodCameraMonitoringStore } from '@/modules/cameras'

type CameraStore = ReturnType<typeof useFloodCameraMonitoringStore>

const probability = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const useMapCameraMarkers = (ctrl: CameraStore) => {
  const markers = shallowRef<mapboxgl.Marker[]>([])

  const setup = (map: mapboxgl.Map) => {
    cleanup()
    ctrl.camerasRaw.forEach((camera) => {
      const coordinates = cameraCoordinates(camera)
      if (!coordinates || !isInsideAquaTerritory(coordinates)) {
        console.warn('Câmera sem coordenadas:', camera)
        return
      }
      const analysis = camera.operational.analysis
      const flooded = probability(analysis.probabilities?.flooded)
      const classification =
        typeof analysis.classification === 'string' ? analysis.classification : null
      const icon =
        classification === 'FLOOD_INDICATION' ||
        (classification === null && flooded !== null && flooded >= 70)
          ? 'camera_icon_flood.svg'
          : classification === 'INTERMEDIATE_INDICATION' ||
              (classification === null && flooded !== null && flooded >= 40)
            ? 'camera_icon_medium.svg'
            : 'camera_icon_normal.svg'
      const element = document.createElement('div')
      element.className = 'custom-marker'
      Object.assign(element.style, {
        backgroundImage: `url("/icons/${icon}")`, width: '80px', height: '80px',
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', cursor: 'pointer',
      })
      element.addEventListener('click', () => void router.push(`/cameras/${camera.id}`))
      const marker = new mapboxgl.Marker(element).setLngLat(coordinates)
      if (ctrl.showCameras) marker.addTo(map)
      markers.value.push(marker)
    })
  }

  const setVisible = (map: mapboxgl.Map, visible: boolean) => {
    markers.value.forEach((marker) => (visible ? marker.addTo(map) : marker.remove()))
  }

  function cleanup() {
    markers.value.forEach((marker) => marker.remove())
    markers.value = []
  }

  return { setup, setVisible, cleanup }
}
