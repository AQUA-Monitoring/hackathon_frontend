import { describe, expect, it } from 'vitest'
import type { CameraApiItem, CameraStatus } from '../types/camera'
import {
  cameraStatusOptionDisabled,
  cameraTerritorialWarning,
  neighborhoodHasCanonicalRegion,
} from './cameraTerritorialReadiness'

function camera(status: CameraStatus, hasRegion: boolean): CameraApiItem {
  return {
    id: 'camera-1',
    description: 'Câmera teste',
    status,
    administrative_status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    address: null,
    region: hasRegion ? { id: 'region-1', name: 'Região teste' } : null,
    operational: {
      stream: { status: 'UNKNOWN', checked_at: null },
      analysis: {
        status: 'NOT_ANALYZED',
        classification: null,
        confidence: null,
        probabilities: null,
        analyzed_at: null,
        frames: null,
        model: null,
      },
    },
    created_at: '2026-08-28T00:00:00Z',
    updated_at: '2026-08-28T00:00:00Z',
  }
}

describe('camera territorial readiness', () => {
  it('identifies whether the selected neighborhood has a canonical region', () => {
    expect(neighborhoodHasCanonicalRegion(null)).toBe(false)
    expect(neighborhoodHasCanonicalRegion({ id: 'n-1', name: 'Centro', region: null })).toBe(
      false,
    )
    expect(
      neighborhoodHasCanonicalRegion({
        id: 'n-1',
        name: 'Centro',
        region: { id: 'r-1', name: 'Central' },
      }),
    ).toBe(true)
  })

  it('blocks operational options only for inactive regionless cameras', () => {
    const draft = camera('INACTIVE', false)
    expect(cameraStatusOptionDisabled(draft, 'ACTIVE')).toBe(true)
    expect(cameraStatusOptionDisabled(draft, 'OFFLINE')).toBe(true)
    expect(cameraStatusOptionDisabled(draft, 'INACTIVE')).toBe(false)

    const legacy = camera('ACTIVE', false)
    expect(cameraStatusOptionDisabled(legacy, 'OFFLINE')).toBe(false)
    expect(cameraStatusOptionDisabled(camera('INACTIVE', true), 'ACTIVE')).toBe(false)
  })

  it('distinguishes draft and legacy territorial warnings', () => {
    expect(cameraTerritorialWarning(camera('INACTIVE', false))).toContain('não poderá ser ativada')
    expect(cameraTerritorialWarning(camera('ACTIVE', false))).toContain('câmera legada')
    expect(cameraTerritorialWarning(camera('ACTIVE', true))).toBeNull()
  })
})
