import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import confetti from 'canvas-confetti';

import { CameraWidget } from '@/components/attendance/CameraWidget.jsx';
import { AttendanceModal } from '@/components/attendance/AttendanceModal.jsx';
import { stampAttendanceWatermark } from '@/utils/canvasWatermark.js';
import { getActiveMockContext } from '../../mocks/canvasMock.js';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { initStorage, getAttendances } from '@/utils/storage.js';

describe('Tier 1 - R2: Live Camera Stream, Canvas Watermark & Compressed Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T1-R2-01: Live Camera Stream Acquisition & Mirror Preview', async () => {
    const mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ stop: vi.fn() }],
    });

    navigator.mediaDevices.getUserMedia = mockGetUserMedia;

    render(<CameraWidget />);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'user' },
      });
      expect(screen.getByTestId('camera-video-feed')).toBeInTheDocument();
    });

    const video = screen.getByTestId('camera-video-feed');
    // Inverted mirror perception
    expect(video.style.transform).toBe('scaleX(-1)');
  });

  it('T1-R2-02: Camera Simulator Fallback Activation', async () => {
    // Mock getUserMedia rejection
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
      new DOMException('Camera blocked', 'NotAllowedError')
    );

    render(<CameraWidget />);

    // Expect simulator banner and viewfinder
    await waitFor(() => {
      expect(screen.getByTestId('simulator-banner')).toHaveTextContent('Mode Simulator Aktif');
    });

    expect(screen.getByTestId('camera-simulator-viewfinder')).toBeInTheDocument();

    // Shutter button remains active
    const shutterBtn = screen.getByTestId('btn-camera-shutter');
    expect(shutterBtn).toBeInTheDocument();
  });

  it('T1-R2-03: Canvas Watermark Compositor Stamping', async () => {
    const mockVideo = document.createElement('video');
    Object.defineProperty(mockVideo, 'videoWidth', { value: 640 });
    Object.defineProperty(mockVideo, 'videoHeight', { value: 480 });

    const metadata = {
      nik: '2024001',
      name: 'Budi Santoso',
      tenantName: 'PT Teknologi Nusantara',
      department: 'Teknologi Informasi',
      status: 'Tepat Waktu',
      type: 'MASUK',
      coords: { lat: -6.2088, lng: 106.8456, address: 'Jl. Sudirman No. 1, Jakarta' },
    };

    const dataUrl = await stampAttendanceWatermark(mockVideo, metadata);

    expect(typeof dataUrl).toBe('string');
    expect(dataUrl).toContain('data:image/jpeg;base64,');

    // Hardened assertion: inspect canvas 2D context stamping calls
    const ctx = getActiveMockContext();
    expect(ctx).toBeTruthy();
    const texts = ctx.fillText.mock.calls.map((c) => c[0]);
    expect(texts.some((t) => t.includes(metadata.nik) && t.includes(metadata.name))).toBe(true);
    expect(texts.some((t) => t.includes(metadata.tenantName))).toBe(true);
    expect(texts.some((t) => t.includes(metadata.status) && t.includes(metadata.type))).toBe(true);
    expect(texts.some((t) => t.includes('-6.2088') || t.includes(metadata.coords.address))).toBe(true);
  });

  it('T1-R2-04: Image Downscale & Base64 JPEG Compression', async () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 1920;
    mockCanvas.height = 1080;

    const metadata = {
      nik: '2024001',
      name: 'Budi Santoso',
      tenantName: 'PT Teknologi Nusantara',
      department: 'Engineering',
      status: 'Tepat Waktu',
      type: 'MASUK',
    };

    const dataUrl = await stampAttendanceWatermark(mockCanvas, metadata);

    // Starts with image/jpeg base64
    expect(dataUrl).toContain('data:image/jpeg;base64,');
    // Compressed size under 65,000 characters
    expect(dataUrl.length).toBeLessThan(65000);

    // Hardened assertion: inspect canvas 2D context stamping calls
    const ctx = getActiveMockContext();
    expect(ctx).toBeTruthy();
    const texts = ctx.fillText.mock.calls.map((c) => c[0]);
    expect(texts.some((t) => t.includes(metadata.nik) && t.includes(metadata.name))).toBe(true);
    expect(texts.some((t) => t.includes(metadata.tenantName))).toBe(true);
  });

  it('T1-R2-05: Attendance Modal Submission & Confetti Celebration', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    // Pre-seed authenticated user
    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        department: 'Engineering',
      })
    );

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceModal
            isOpen={true}
            type="MASUK"
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        </AuthProvider>
      </TenantProvider>
    );

    // Step 1: Click shutter "Ambil Foto"
    const shutterBtn = screen.getByTestId('btn-camera-shutter');
    await user.click(shutterBtn);

    // Step 2: Watermark preview screen appears
    await waitFor(() => {
      expect(screen.getByTestId('watermark-preview-screen')).toBeInTheDocument();
    });

    // Step 3: Click "Kirim Presensi"
    const submitBtn = screen.getByTestId('btn-submit-attendance');
    await user.click(submitBtn);

    // Verify celebration confetti was called
    expect(confetti).toHaveBeenCalled();

    // Verify record saved to storage
    await waitFor(() => {
      const records = getAttendances();
      const newRec = records.find((r) => r.userNik === 'EMP-001');
      expect(newRec).toBeDefined();
      expect(newRec.type).toBe('MASUK');
    });
  });

  it('T1-R2-06: Geofence Radius & Punctuality Calculation', () => {
    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceModal isOpen={true} type="MASUK" onClose={vi.fn()} />
        </AuthProvider>
      </TenantProvider>
    );

    const geofenceBadge = screen.getByTestId('geofence-status');
    const punctualityBadge = screen.getByTestId('punctuality-status');

    expect(geofenceBadge).toBeInTheDocument();
    expect(geofenceBadge).toHaveTextContent('Dalam Radius Kantor');
    expect(punctualityBadge).toBeInTheDocument();
  });
});
