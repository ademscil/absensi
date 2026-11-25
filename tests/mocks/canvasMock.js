import { vi } from 'vitest'

export function createMockCanvasContext(canvasElement) {
  const mockCtx = {
    canvas: canvasElement || { width: 640, height: 480 },
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    rect: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn((text) => ({
      width: text ? String(text).length * 8 : 0,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
    })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createPattern: vi.fn(),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    font: '16px sans-serif',
    textAlign: 'left',
    textBaseline: 'top',
    lineWidth: 1,
    globalAlpha: 1.0,
  }
  return mockCtx
}

let activeMockCtx = null

export function getActiveMockContext() {
  return activeMockCtx
}

export function setupCanvasMock() {
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
  const originalToBlob = HTMLCanvasElement.prototype.toBlob

  HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === '2d') {
      activeMockCtx = createMockCanvasContext(this)
      return activeMockCtx
    }
    if (type === 'webgl' || type === 'webgl2') {
      return {
        canvas: this,
        getParameter: vi.fn(),
        getExtension: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        enable: vi.fn(),
        viewport: vi.fn(),
        clearColor: vi.fn(),
        clear: vi.fn(),
      }
    }
    return originalGetContext ? originalGetContext.call(this, type) : null
  }

  HTMLCanvasElement.prototype.toDataURL = vi.fn(function (type = 'image/jpeg', quality = 0.7) {
    return `data:${type};base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mockattendancewatermarkimage`
  })

  HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback, type = 'image/jpeg') {
    const blob = new Blob(['mock-binary-image'], { type })
    if (callback) callback(blob)
    return Promise.resolve(blob)
  })

  return {
    getActiveContext: () => activeMockCtx,
    restore() {
      HTMLCanvasElement.prototype.getContext = originalGetContext
      HTMLCanvasElement.prototype.toDataURL = originalToDataURL
      HTMLCanvasElement.prototype.toBlob = originalToBlob
    },
  }
}
