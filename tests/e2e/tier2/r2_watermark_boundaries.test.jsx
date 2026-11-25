import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { CameraWidget } from '@/components/attendance/CameraWidget.jsx';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory.jsx';
import { stampAttendanceWatermark } from '@/utils/canvasWatermark.js';
import { getActiveMockContext } from '../../mocks/canvasMock.js';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { initStorage, setAttendances } from '@/utils/storage.js';

describe('Tier 2 - R2 Boundaries: Camera Failures & Watermark Edge Cases', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T2-R2-01: Explicit Camera Permission Denial (NotAllowedError)', async () => {
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError')
    );

    render(<CameraWidget />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Izin kamera ditolak. Aktifkan izin kamera di browser Anda'
      );
    });

    const simBtn = screen.getByTestId('btn-enable-simulator');
    expect(simBtn).toBeInTheDocument();
  });

  it('T2-R2-02: Video Stream Hardware Busy (NotReadableError)', async () => {
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
      new DOMException('Camera busy', 'NotReadableError')
    );

    render(<CameraWidget />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Kamera sedang digunakan oleh aplikasi lain'
      );
    });

    // Expect no unhandled exception crash, fallback viewfinder is shown
    expect(screen.getByTestId('camera-simulator-viewfinder')).toBeInTheDocument();
  });

  it('T2-R2-03: Extremely Long Employee Name (>50 chars) & Long NIK', async () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 640;
    mockCanvas.height = 480;

    const longMetadata = {
      nik: '1989010120150310020033',
      name: 'Raden Mas Arya Suryadiningrat Panji Kusuma Hadinagoro',
      tenantName: 'Badan Layanan Pemerintahan Daerah',
      department: 'Dinas Komunikasi, Informatika, Statistik dan Persandian',
      status: 'Tepat Waktu',
      type: 'MASUK',
    };

    const dataUrl = await stampAttendanceWatermark(mockCanvas, longMetadata);
    expect(dataUrl).toBeDefined();
    expect(dataUrl).toContain('data:image/jpeg;base64,');

    // Hardened assertion: inspect canvas 2D context stamping calls
    const ctx = getActiveMockContext();
    expect(ctx).toBeTruthy();
    const texts = ctx.fillText.mock.calls.map((c) => c[0]);
    expect(texts.some((t) => t.includes(longMetadata.nik) && t.includes(longMetadata.name))).toBe(true);
    expect(texts.some((t) => t.includes(longMetadata.tenantName))).toBe(true);
    expect(texts.some((t) => t.includes(longMetadata.status) && t.includes(longMetadata.type))).toBe(true);
  });

  it('T2-R2-04: Geolocation Timeout or Denied', async () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 640;
    mockCanvas.height = 480;

    // GPS denied / timeout
    const metaWithoutGps = {
      nik: '2024001',
      name: 'Budi Santoso',
      tenantName: 'PT Nusantara',
      coords: { lat: 0, lng: 0, address: 'Lokasi Tidak Terdeteksi' },
    };

    const dataUrl = await stampAttendanceWatermark(mockCanvas, metaWithoutGps);
    expect(dataUrl).toBeDefined();
    expect(dataUrl).toContain('data:image/jpeg;base64,');

    // Hardened assertion: inspect canvas 2D context stamping calls
    const ctx = getActiveMockContext();
    expect(ctx).toBeTruthy();
    const texts = ctx.fillText.mock.calls.map((c) => c[0]);
    expect(texts.some((t) => t.includes(metaWithoutGps.nik) && t.includes(metaWithoutGps.name))).toBe(true);
    expect(texts.some((t) => t.includes(metaWithoutGps.tenantName))).toBe(true);
    expect(texts.some((t) => t.includes('Lokasi GPS Tidak Terdeteksi'))).toBe(true);
  });

  it('T2-R2-05: Corrupted / Malformed Base64 Photo Rendering', () => {
    setAttendances([
      {
        id: 'corrupt-1',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        date: '2026-11-24',
        time: '08:00:00',
        status: 'Tepat Waktu',
        photoDataUrl: 'data:image/jpeg;base64,CORRUPTED_GARBAGE_PAYLOAD',
      },
    ]);

    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
      })
    );

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceHistory />
        </AuthProvider>
      </TenantProvider>
    );

    // Find image and fire onError
    const img = screen.getByRole('img');
    fireEvent.error(img);

    // Expect placeholder avatar to be rendered
    expect(screen.getByTestId('photo-placeholder-avatar')).toBeInTheDocument();
  });

  it('T2-R2-06: Stream Track Termination on Component Unmount', async () => {
    const stopSpy = vi.fn();
    const mockStream = {
      getTracks: () => [{ stop: stopSpy }],
      getVideoTracks: () => [{ stop: stopSpy }],
    };

    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);

    const { unmount } = render(<CameraWidget />);

    await waitFor(() => {
      expect(screen.getByTestId('camera-video-feed')).toBeInTheDocument();
    });

    // Unmount CameraWidget
    unmount();

    // Verify track.stop() was called
    expect(stopSpy).toHaveBeenCalled();
  });
});
