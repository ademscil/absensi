import { vi } from 'vitest'
import * as XLSX from 'xlsx'

export function setupExcelMock() {
  const originalCreateObjectURL = window.URL.createObjectURL
  const originalRevokeObjectURL = window.URL.revokeObjectURL

  const capturedUrls = []
  const capturedBlobs = []

  window.URL.createObjectURL = vi.fn((blob) => {
    const url = `blob:mock-excel-${Math.random().toString(36).slice(2)}`
    capturedUrls.push(url)
    capturedBlobs.push(blob)
    return url
  })

  window.URL.revokeObjectURL = vi.fn()

  return {
    capturedUrls,
    capturedBlobs,
    getLastBlob: () => capturedBlobs[capturedBlobs.length - 1],
    async parseLastBlobToWorkbook() {
      const blob = capturedBlobs[capturedBlobs.length - 1]
      if (!blob) return null
      const arrayBuffer = await blob.arrayBuffer()
      return XLSX.read(arrayBuffer, { type: 'buffer' })
    },
    verifyZipHeader(uint8Array) {
      if (!uint8Array || uint8Array.length < 4) return false
      // ZIP magic numbers: PK\x03\x04 -> 0x50, 0x4B, 0x03, 0x04
      return (
        uint8Array[0] === 0x50 &&
        uint8Array[1] === 0x4B &&
        uint8Array[2] === 0x03 &&
        uint8Array[3] === 0x04
      )
    },
    restore() {
      window.URL.createObjectURL = originalCreateObjectURL
      window.URL.revokeObjectURL = originalRevokeObjectURL
    },
  }
}
