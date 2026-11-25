import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { setupCanvasMock } from './mocks/canvasMock'
import { setupMediaMock } from './mocks/mediaMock'
import { setupExcelMock } from './mocks/excelMock'

// 1. Initialize Canvas & WebGL stubs
setupCanvasMock()

// 2. Initialize Media Devices stubs
setupMediaMock()

// 3. Initialize Excel / ObjectURL stubs
setupExcelMock()

// 4. HTMLMediaElement play/pause stubs
if (!window.HTMLMediaElement.prototype.play) {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
} else {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
}
window.HTMLMediaElement.prototype.pause = vi.fn()

Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  configurable: true,
  get: () => 640,
})
Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  configurable: true,
  get: () => 480,
})

// 5. Animation & Timing stubs
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = vi.fn((cb) => setTimeout(() => cb(Date.now()), 16))
}
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))
}

// 6. Observers
globalThis.ResizeObserver = class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

globalThis.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// 7. matchMedia stub
let mediaQueryMatches = false
export const setMediaQueryMatches = (matches) => {
  mediaQueryMatches = matches
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: mediaQueryMatches || (query.includes('prefers-reduced-motion') ? false : false),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 8. canvas-confetti mock
vi.mock('canvas-confetti', () => {
  const mockConfetti = vi.fn().mockResolvedValue(true)
  return {
    default: mockConfetti,
    create: vi.fn(() => mockConfetti),
  }
})

// 9. Configurable LocalStorage Quota Exceeded simulator
let simulateQuotaError = false
export const setSimulateQuotaError = (flag) => {
  simulateQuotaError = flag
}

const originalSetItem = Storage.prototype.setItem
Storage.prototype.setItem = function (key, value) {
  if (simulateQuotaError) {
    const err = new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    throw err
  }
  return originalSetItem.call(this, key, value)
}

// 10. Geolocation stub
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success, error, options) => {
    success({
      coords: {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
  }),
  watchPosition: vi.fn().mockReturnValue(1),
  clearWatch: vi.fn(),
}

Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  configurable: true,
  value: mockGeolocation,
})

// 11. Cleanup hooks
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  simulateQuotaError = false
  mediaQueryMatches = false
  setupMediaMock()
  window.localStorage.clear()
})
