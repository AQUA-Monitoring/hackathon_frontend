import { computed, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useFloodImpactStore } from '@/stores/FloodImpact'
import type { HotspotCollection, ImpactLineCollection } from '@/types/floodImpact'

export function useFloodImpact() {
  const store = useFloodImpactStore()
  const state = storeToRefs(store)

  const affectedRoadsGeoJSON = computed<ImpactLineCollection>(() => ({
    type: 'FeatureCollection',
    features: state.affectedRoads.value.flatMap((impact) => {
      if (!impact.intersection) return []
      const geometry =
        impact.intersection.type === 'Feature'
          ? impact.intersection.geometry
          : impact.intersection
      return [
        {
          type: 'Feature' as const,
          geometry,
          properties: {
            id: impact.id,
            street_name: impact.street_name ?? 'Trecho sem nome',
            evidence_kind: impact.evidence_kind,
            relation: impact.relation,
          },
        },
      ]
    }),
  }))

  const hotspotsGeoJSON = computed<HotspotCollection>(() => ({
    type: 'FeatureCollection',
    features: state.hotspots.value.flatMap((hotspot) => {
      if (!hotspot.geometry) return []
      const geometry = hotspot.geometry.type === 'Feature' ? hotspot.geometry.geometry : hotspot.geometry
      return [
        {
          type: 'Feature' as const,
          geometry,
          properties: {
            id: hotspot.id,
            recurrence_score: hotspot.recurrence_score,
            confirmed_event_count: hotspot.confirmed_event_count,
            name: hotspot.name ?? 'Ponto crítico',
          },
        },
      ]
    }),
  }))

  return Object.assign(
    reactive({ ...state, affectedRoadsGeoJSON, hotspotsGeoJSON }),
    {
      loadEvents: store.loadEvents,
      selectEvent: store.selectEvent,
      loadHotspots: store.loadHotspots,
      selectHotspot: store.selectHotspot,
    },
  )
}
