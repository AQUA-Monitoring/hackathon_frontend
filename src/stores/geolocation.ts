import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useNeighborhood } from '@/modules/addressing'

export const useGeolocationStore = defineStore('geolocation', () => {
  const latitude = ref<number | null>(null)
  const longitude = ref<number | null>(null)
  let watchId: number | null
  const neighborhood = ref<string | null>(null)
  const city = ref<string | null>(null)
  const { loadNeighborhoods, getLocalization } = useNeighborhood()

  function startTracking() {
    if (!('geolocation' in navigator)) {
      return
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        latitude.value = position.coords.latitude
        longitude.value = position.coords.longitude
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            break
          case error.POSITION_UNAVAILABLE:
            break
          case error.TIMEOUT:
            break
          default:
            break
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      },
    )
  }

  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  }

  interface LocationResult {
    neighborhood: string | null
    city: string | null
  }

  async function findNeighborhood(): Promise<LocationResult | null> {
    await loadNeighborhoods()
    startTracking()

    return new Promise((resolve) => {
      const stop = watch(
        [() => latitude.value, () => longitude.value],
        ([lat, lng], _, onCleanup) => {
          if (lat != null && lng != null) {
            try {
              const result = getLocalization(lng, lat)

              if (result) {
                neighborhood.value = result.neighborhood
                city.value = result.city
              } else {
                neighborhood.value = null
                city.value = null
              }

              resolve({
                neighborhood: neighborhood.value,
                city: city.value,
              })
            } catch (error) {
              console.error('Erro ao buscar bairro:', error)
              resolve(null)
              onCleanup(() => stop())
            }
          }
        },
        { immediate: true },
      )
    })
  }

  const getCurrentPosition = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        () => resolve({ latitude: 0, longitude: 0 }),
      )
    })
  }

  return {
    latitude,
    longitude,
    neighborhood,
    city,
    startTracking,
    stopTracking,
    findNeighborhood,
    getCurrentPosition,
  }
})
