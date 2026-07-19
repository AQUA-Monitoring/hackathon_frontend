import { computed, reactive } from 'vue'
import type { CameraCreatePayload } from '@/types/camera'
import type { CameraCreateFormState } from '@/types/cameraCreate'

function validUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function useCameraCreateForm() {
  const form = reactive<CameraCreateFormState>({
    city_id: '',
    neighborhood_id: '',
    street: '',
    number: '',
    state: 'SC',
    country: 'Brasil',
    zipcode: '',
    latitude: null,
    longitude: null,
    description: '',
    video_hls: '',
    video_embed: '',
    street_id: null,
    address_reference_id: null,
  })

  const locationErrors = computed(() => {
    const errors: string[] = []

    if (!form.city_id) errors.push('Selecione a cidade cadastrada.')
    if (!form.neighborhood_id) errors.push('Selecione o bairro correspondente.')
    if (!form.street.trim()) errors.push('Confirme a rua ou logradouro.')
    // if (!form.state.trim()) errors.push('Informe o estado.')
    if (!form.country.trim()) errors.push('Informe o país.')

    if (form.latitude === null || form.latitude < -90 || form.latitude > 90) {
      errors.push('Informe uma latitude válida.')
    }

    if (form.longitude === null || form.longitude < -180 || form.longitude > 180) {
      errors.push('Informe uma longitude válida.')
    }

    return errors
  })

  const cameraErrors = computed(() => {
    const errors: string[] = []

    if (!form.description.trim()) {
      errors.push('Informe uma descrição para identificar a câmera.')
    }

    if (!validUrl(form.video_hls.trim())) {
      errors.push('Informe uma URL HLS HTTP ou HTTPS válida.')
    }

    if (form.video_embed.trim() && !validUrl(form.video_embed.trim())) {
      errors.push('A URL de embed deve usar HTTP ou HTTPS.')
    }

    return errors
  })

  function setCoordinateFromEvent(axis: 'latitude' | 'longitude', event: Event) {
    const raw = (event.target as HTMLInputElement).value.trim()

    if (!raw) {
      form[axis] = null
      form.address_reference_id = null
      return
    }

    const value = Number(raw)
    form[axis] = Number.isFinite(value) ? value : null
    form.address_reference_id = null
  }

  function buildPayload(): CameraCreatePayload | null {
    if (form.latitude === null || form.longitude === null) return null

    return {
      description: form.description.trim(),
      video_hls: form.video_hls.trim(),
      video_embed: form.video_embed.trim() || null,
      address: {
        city_id: form.city_id,
        neighborhood_id: form.neighborhood_id,
        street: form.street.trim(),
        number: form.number.trim(),
        // O estado é opcional na interface, mas o contrato de endereço deve
        // sempre recebê-lo. Joinville e os municípios cadastrados neste fluxo
        // pertencem a SC; mantemos o valor padrão caso o campo seja apagado.
        state: form.state.trim() || 'SC',
        country: form.country.trim(),
        zipcode: form.zipcode.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        // Quando há referência territorial, ela é a fonte canônica da rua.
        // Evita enviar um street_id antigo que o backend possa considerar
        // inconsistente com a referência selecionada.
        street_id: form.address_reference_id ? null : form.street_id,
        address_reference_id: form.address_reference_id,
      },
    }
  }

  return {
    form,
    locationErrors,
    cameraErrors,
    setCoordinateFromEvent,
    buildPayload,
  }
}
