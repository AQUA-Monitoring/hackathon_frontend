import { defineStore } from 'pinia'
import { ref } from 'vue'
import FloodImpactApi from '../services/FloodImpact'
import type {
  FloodHotspot,
  FloodHotspotHistoryItem,
  FloodImpactFilters,
  FloodSpatialEvent,
  RoadFloodImpact,
} from '../types/floodImpact'

const api = new FloodImpactApi()

export const useFloodImpactStore = defineStore('flood-impact', () => {
  const events = ref<FloodSpatialEvent[]>([])
  const affectedRoads = ref<RoadFloodImpact[]>([])
  const hotspots = ref<FloodHotspot[]>([])
  const hotspotHistory = ref<FloodHotspotHistoryItem[]>([])
  const selectedEvent = ref<FloodSpatialEvent | null>(null)
  const selectedHotspot = ref<FloodHotspot | null>(null)
  const loading = ref(false)
  const unavailable = ref(false)
  const error = ref<string | null>(null)

  function beginRequest() {
    loading.value = true
    unavailable.value = false
    error.value = null
  }

  function failRequest(message: string) {
    unavailable.value = true
    error.value = message
  }

  async function loadEvents(filters: FloodImpactFilters = {}) {
    beginRequest()
    try {
      events.value = (await api.getEvents(filters)).results
    } catch {
      failRequest('O catálogo de eventos espaciais está indisponível no momento.')
    } finally {
      loading.value = false
    }
  }

  async function selectEvent(event: FloodSpatialEvent | null) {
    selectedEvent.value = event
    affectedRoads.value = []
    if (!event) return
    beginRequest()
    try {
      affectedRoads.value = (await api.getAffectedRoads(event.id)).results
    } catch {
      failRequest('Não foi possível consultar os trechos viários deste evento.')
    } finally {
      loading.value = false
    }
  }

  async function loadHotspots(filters: FloodImpactFilters = {}) {
    beginRequest()
    try {
      hotspots.value = (await api.getHotspots(filters)).results
    } catch {
      failRequest('O histórico de pontos críticos está indisponível no momento.')
    } finally {
      loading.value = false
    }
  }

  async function selectHotspot(hotspot: FloodHotspot | null) {
    selectedHotspot.value = hotspot
    hotspotHistory.value = []
    if (!hotspot) return
    beginRequest()
    try {
      hotspotHistory.value = (await api.getHotspotHistory(hotspot.id)).results
    } catch {
      failRequest('Não foi possível carregar o histórico deste ponto crítico.')
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    affectedRoads,
    hotspots,
    hotspotHistory,
    selectedEvent,
    selectedHotspot,
    loading,
    unavailable,
    error,
    loadEvents,
    selectEvent,
    loadHotspots,
    selectHotspot,
  }
})
