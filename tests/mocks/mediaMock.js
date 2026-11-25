import { vi } from 'vitest'

export function createMockMediaStream() {
  const mockTrack = {
    id: 'mock-track-id-' + Math.random().toString(36).slice(2),
    kind: 'video',
    enabled: true,
    readyState: 'live',
    stop: vi.fn(),
  }

  const stream = {
    id: 'mock-stream-id-' + Math.random().toString(36).slice(2),
    active: true,
    getTracks: vi.fn(() => [mockTrack]),
    getVideoTracks: vi.fn(() => [mockTrack]),
    getAudioTracks: vi.fn(() => []),
  }

  return { stream, track: mockTrack }
}

export function setupMediaMock(options = {}) {
  const { shouldFail = false, errorType = 'NotAllowedError', errorMessage = 'Permission denied' } = options

  const { stream, track } = createMockMediaStream()

  const getUserMediaMock = vi.fn().mockImplementation(() => {
    if (shouldFail) {
      return Promise.reject(new DOMException(errorMessage, errorType))
    }
    return Promise.resolve(stream)
  })

  const enumerateDevicesMock = vi.fn().mockResolvedValue([
    { deviceId: 'default', kind: 'videoinput', label: 'Front Facing Camera' },
    { deviceId: 'back-camera', kind: 'videoinput', label: 'Back Camera' },
  ])

  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {},
    })
  }

  navigator.mediaDevices.getUserMedia = getUserMediaMock
  navigator.mediaDevices.enumerateDevices = enumerateDevicesMock

  return {
    stream,
    track,
    getUserMediaMock,
    enumerateDevicesMock,
    simulateDenial() {
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )
    },
    simulateBusy() {
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Camera busy', 'NotReadableError')
      )
    },
    restoreDefault() {
      navigator.mediaDevices.getUserMedia = getUserMediaMock
    },
  }
}
