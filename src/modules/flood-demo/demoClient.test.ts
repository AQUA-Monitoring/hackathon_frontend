import { describe, expect, it } from 'vitest'
import {
  isCompletedAnalysisPrevious,
  shouldPromoteCompletedAnalysis,
} from './demoAnalysisState'
import { normalizeDemoHlsUrl } from './services/FloodDemo'
import {
  nextMediaRecoveryAttempt,
  supportsRequiredCodec,
} from '@/shared/composables/useHlsStream'

describe('normalizeDemoHlsUrl', () => {
  it('uses the same-origin proxy for an absolute HLS URL', () => {
    expect(
      normalizeDemoHlsUrl(
        'http://100.81.148.127:8188/hls/playlist.m3u8?session=1',
        'https://aqua.example',
      ),
    ).toBe('/hls/playlist.m3u8?session=1')
  })

  it('preserves non-HLS URLs', () => {
    expect(normalizeDemoHlsUrl('https://media.example/live.m3u8', 'https://aqua.example')).toBe(
      'https://media.example/live.m3u8',
    )
  })
})

describe('HLS capability and recovery', () => {
  it('rejects an explicitly unsupported codec', () => {
    expect(supportsRequiredCodec('video/mp4; codecs="avc1.64001f"', {
      isTypeSupported: () => false,
    })).toBe(false)
  })

  it('stops media recovery after four attempts', () => {
    expect(nextMediaRecoveryAttempt(3)).toEqual({ attempt: 4, canRecover: true })
    expect(nextMediaRecoveryAttempt(4)).toEqual({ attempt: 5, canRecover: false })
  })
})

describe('completed demo analysis', () => {
  it('promotes results monotonically', () => {
    expect(shouldPromoteCompletedAnalysis(10, 11)).toBe(true)
    expect(shouldPromoteCompletedAnalysis(10, 10)).toBe(true)
    expect(shouldPromoteCompletedAnalysis(10, 9)).toBe(false)
  })

  it('marks a retained result as previous only after the player advances', () => {
    expect(isCompletedAnalysisPrevious(10, 10)).toBe(false)
    expect(isCompletedAnalysisPrevious(10, 11)).toBe(true)
    expect(isCompletedAnalysisPrevious(10, null)).toBe(false)
  })
})
