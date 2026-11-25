/**
 * Milestone 3 Comprehensive Unit & Integration Test Suite
 * Covers 6 Modules and 40 Tests as specified in M3 Specification & Architecture
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import confetti from 'canvas-confetti';

import { CameraWidget } from '@/components/attendance/CameraWidget.jsx';
import { AttendanceModal } from '@/components/attendance/AttendanceModal.jsx';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory.jsx';
import {
  stampAttendanceWatermark,
  generateAuthHash,
} from '@/utils/canvasWatermark.js';
import {
  initStorage,
  getAttendances,
  setAttendances,
  addAttendance,
  saveAttendanceRecord,
} from '@/utils/storage.js';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { getActiveMockContext } from '../../tests/mocks/canvasMock.js';

describe('Milestone 3: Live Selfie Camera & Canvas Watermark Pipeline', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
    vi.clearAllMocks();
  });

  // =========================================================================
  // Module 1: Camera Hardware Acquisition & Stream Management (CameraWidget)
  // =========================================================================
  describe('Module 1: Camera Hardware Acquisition & Stream Management', () => {
    it('MW-CAM-01: Invokes navigator.mediaDevices.getUserMedia with front camera constraint', async () => {
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
    });

    it('MW-CAM-02: Applies CSS mirror perception transform: scaleX(-1) to video element', async () => {
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
        getVideoTracks: () => [{ stop: vi.fn() }],
      });

      render(<CameraWidget />);

      await waitFor(() => {
        expect(screen.getByTestId('camera-video-feed')).toBeInTheDocument();
      });
      const video = screen.getByTestId('camera-video-feed');
      expect(video.style.transform).toBe('scaleX(-1)');
    });

    it('MW-CAM-03: Attaches active stream to video.srcObject and triggers video.play()', async () => {
      const playSpy = vi.fn().mockResolvedValue(true);
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
        getVideoTracks: () => [{ stop: vi.fn() }],
      };
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);
      window.HTMLMediaElement.prototype.play = playSpy;

      render(<CameraWidget />);

      await waitFor(() => {
        const video = screen.getByTestId('camera-video-feed');
        expect(video.srcObject).toBe(mockStream);
        expect(playSpy).toHaveBeenCalled();
      });
    });

    it('MW-CAM-04: Stops and cleans up all media stream tracks on component unmount', async () => {
      const stopTrackSpy = vi.fn();
      const mockStream = {
        getTracks: () => [{ stop: stopTrackSpy }],
        getVideoTracks: () => [{ stop: stopTrackSpy }],
      };
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);

      const { unmount } = render(<CameraWidget />);

      await waitFor(() => {
        expect(screen.getByTestId('camera-video-feed')).toBeInTheDocument();
      });

      unmount();
      expect(stopTrackSpy).toHaveBeenCalled();
    });

    it('MW-CAM-05: Renders shutter button with accessible touch target (min-h-[44px])', () => {
      render(<CameraWidget forceSimulator={true} />);
      const shutterBtn = screen.getByTestId('btn-camera-shutter');
      expect(shutterBtn).toBeInTheDocument();
      expect(shutterBtn.className).toContain('min-h-[44px]');
      expect(shutterBtn).toHaveTextContent('Ambil Foto');
    });

    it('MW-CAM-06: Passes video element and isSimulator=false to onCapture in live mode', async () => {
      const handleCapture = vi.fn();
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
        getVideoTracks: () => [{ stop: vi.fn() }],
      };
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);

      render(<CameraWidget onCapture={handleCapture} />);

      await waitFor(() => {
        expect(screen.getByTestId('camera-video-feed')).toBeInTheDocument();
      });

      const shutterBtn = screen.getByTestId('btn-camera-shutter');
      fireEvent.click(shutterBtn);

      expect(handleCapture).toHaveBeenCalledTimes(1);
      expect(handleCapture).toHaveBeenCalledWith(expect.any(HTMLVideoElement), false);
    });
  });

  // =========================================================================
  // Module 2: Camera Simulator Fallback Engine (CameraWidget)
  // =========================================================================
  describe('Module 2: Camera Simulator Fallback Engine', () => {
    it('MW-SIM-01: Automatically activates simulator on NotAllowedError with exact alert text', async () => {
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      );

      render(<CameraWidget />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Izin kamera ditolak. Aktifkan izin kamera di browser Anda'
        );
      });
      expect(screen.getByTestId('simulator-banner')).toHaveTextContent('Mode Simulator Aktif');
      expect(screen.getByTestId('camera-simulator-viewfinder')).toBeInTheDocument();
    });

    it('MW-SIM-02: Automatically activates simulator on NotReadableError with exact alert text', async () => {
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Camera hardware in use', 'NotReadableError')
      );

      render(<CameraWidget />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Kamera sedang digunakan oleh aplikasi lain'
        );
      });
      expect(screen.getByTestId('simulator-banner')).toHaveTextContent('Mode Simulator Aktif');
      expect(screen.getByTestId('camera-simulator-viewfinder')).toBeInTheDocument();
    });

    it('MW-SIM-03: Automatically activates simulator on NotFoundError with fallback error message', async () => {
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Camera not found', 'NotFoundError')
      );

      render(<CameraWidget />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Gagal mengakses perangkat kamera');
      });
      expect(screen.getByTestId('simulator-banner')).toHaveTextContent('Mode Simulator Aktif');
      expect(screen.getByTestId('camera-simulator-viewfinder')).toBeInTheDocument();
    });

    it('MW-SIM-04: Directly activates simulator when forceSimulator={true} prop is provided', () => {
      const getUserMediaSpy = vi.fn();
      navigator.mediaDevices.getUserMedia = getUserMediaSpy;

      render(<CameraWidget forceSimulator={true} />);

      expect(screen.getByTestId('simulator-banner')).toHaveTextContent('Mode Simulator Aktif');
      expect(screen.getByTestId('camera-simulator-viewfinder')).toBeInTheDocument();
      expect(getUserMediaSpy).not.toHaveBeenCalled();
    });

    it('MW-SIM-05: Switches to simulator mode when user clicks btn-enable-simulator', async () => {
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      );

      render(<CameraWidget />);

      await waitFor(() => {
        expect(screen.getByTestId('btn-enable-simulator')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('btn-enable-simulator'));
      expect(screen.getByTestId('camera-simulator-viewfinder')).toBeInTheDocument();
    });

    it('MW-SIM-06: Renders simulated viewfinder with biometric reticle and animated scanline', () => {
      render(<CameraWidget forceSimulator={true} />);
      const viewfinder = screen.getByTestId('camera-simulator-viewfinder');
      expect(viewfinder).toBeInTheDocument();
      expect(viewfinder).toHaveTextContent('Arahkan wajah ke lingkaran panduan');
      expect(screen.getByTestId('viewfinder-scanline')).toBeInTheDocument();
    });

    it('MW-SIM-07: Shutter button in simulator generates 640x480 canvas with [SIMULATED CAMERA VIEW]', () => {
      const handleCapture = vi.fn();
      render(<CameraWidget forceSimulator={true} onCapture={handleCapture} />);

      const shutterBtn = screen.getByTestId('btn-camera-shutter');
      fireEvent.click(shutterBtn);

      expect(handleCapture).toHaveBeenCalledTimes(1);
      const [capturedCanvas, isSim] = handleCapture.mock.calls[0];
      expect(isSim).toBe(true);
      expect(capturedCanvas.width).toBe(640);
      expect(capturedCanvas.height).toBe(480);

      const ctx = getActiveMockContext();
      expect(ctx.fillText).toHaveBeenCalledWith('[SIMULATED CAMERA VIEW]', 320, 240);
    });
  });

  // =========================================================================
  // Module 3: Canvas Watermark Compositor & Anti-Spoofing (canvasWatermark.js)
  // =========================================================================
  describe('Module 3: Canvas Watermark Compositor & Anti-Spoofing', () => {
    it('MW-WM-01: Composites source video frame onto target 640px canvas context', async () => {
      const mockVideo = document.createElement('video');
      Object.defineProperty(mockVideo, 'videoWidth', { value: 640 });
      Object.defineProperty(mockVideo, 'videoHeight', { value: 480 });

      await stampAttendanceWatermark(mockVideo, {
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        tenantName: 'PT Nusantara',
      });

      const ctx = getActiveMockContext();
      expect(ctx.drawImage).toHaveBeenCalledWith(mockVideo, 0, 0, 640, 480);
    });

    it('MW-WM-02: Composites source canvas frame onto target 640px canvas context', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, {
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        tenantName: 'PT Nusantara',
      });

      const ctx = getActiveMockContext();
      expect(ctx.drawImage).toHaveBeenCalledWith(mockCanvas, 0, 0, 640, 480);
    });

    it('MW-WM-03: Calculates proportional height preserving aspect ratio for 16:9 media', async () => {
      const widescreenVideo = document.createElement('video');
      Object.defineProperty(widescreenVideo, 'videoWidth', { value: 1280 });
      Object.defineProperty(widescreenVideo, 'videoHeight', { value: 720 });

      await stampAttendanceWatermark(widescreenVideo, {
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
      });

      const ctx = getActiveMockContext();
      // 720 / 1280 = 0.5625 * 640 = 360
      expect(ctx.drawImage).toHaveBeenCalledWith(widescreenVideo, 0, 0, 640, 360);
    });

    it('MW-WM-04: Renders 120px bottom glassmorphic banner with top accent line', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, {});

      const ctx = getActiveMockContext();
      // 480 - 120 = 360 bannerY
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 360, 640, 120);
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 360, 640, 3);
    });

    it('MW-WM-05: Stamps tenant name onto watermark header line', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, {
        tenantName: 'Kementerian Pendidikan dan Kebudayaan',
      });

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes('Kementerian Pendidikan dan Kebudayaan'))).toBe(true);
    });

    it('MW-WM-06: Stamps timestamp in Indonesian WIB format (DD/MM/YYYY HH:mm:ss WIB)', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, {});

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes('WIB'))).toBe(true);
    });

    it('MW-WM-07: Stamps employee identity line with dynamic label (NIP/NIK)', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, {
        idLabel: 'NIP',
        nik: '198501012010011002',
        name: 'Dr. Hendra Wijaya',
      });

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes('NIP: 198501012010011002 | Nama: Dr. Hendra Wijaya'))).toBe(true);
    });

    it('MW-WM-08: Stamps status and attendance type badges', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, {
        status: 'Terlambat',
        type: 'MASUK',
        department: 'Keuangan',
      });

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes('Status: Terlambat (MASUK) | Dept: Keuangan'))).toBe(true);
    });

    it('MW-WM-09: Stamps GPS coordinates with 4-decimal precision and reverse-geocoded address', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, {
        coords: { lat: -6.2088, lng: 106.8456, address: 'Kantor Pusat Sudirman' },
      });

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes('-6.2088') && t.includes('106.8456') && t.includes('Kantor Pusat Sudirman'))).toBe(true);
    });

    it('MW-WM-10: Generates and stamps deterministic 12-character hex authentication hash', async () => {
      const hash = generateAuthHash('EMP-001', '1700000000000', { lat: -6.2088, lng: 106.8456 });
      expect(hash).toHaveLength(12);
      expect(/^[0-9A-F]{12}$/.test(hash)).toBe(true);

      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, { nik: 'EMP-001' });

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.startsWith('AUTH: #'))).toBe(true);
    });
  });

  // =========================================================================
  // Module 4: Watermark Boundary Conditions & Defensive Fallbacks
  // =========================================================================
  describe('Module 4: Watermark Boundary Conditions & Defensive Fallbacks', () => {
    it('MW-BND-01: Handles missing / null coordinates with emergency fallback text', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, { coords: null });

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes('Lokasi GPS Tidak Terdeteksi (Mode Darurat)'))).toBe(true);
    });

    it('MW-BND-02: Auto-scales font size down when employee name exceeds 35 characters', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      await stampAttendanceWatermark(mockCanvas, {
        name: 'Gusti Pangeran Haryo Panji Kusuma Hadiningrat Surakarta',
      });

      const ctx = getActiveMockContext();
      expect(ctx.font).toContain('11px');
    });

    it('MW-BND-03: Truncates long GPS address strings exceeding 80 characters with ellipsis', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      const longAddress = 'Gedung Menara Batavia Lantai 28, Jalan K.H. Mas Mansyur Kavling 126, Karet Tengsin, Tanah Abang, Jakarta Pusat';
      await stampAttendanceWatermark(mockCanvas, {
        coords: { lat: -6.2, lng: 106.8, address: longAddress },
      });

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.endsWith('...'))).toBe(true);
    });

    it('MW-BND-04: Gracefully handles empty metadata object falling back to defaults', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      const dataUrl = await stampAttendanceWatermark(mockCanvas, {});
      expect(dataUrl).toContain('data:image/jpeg;base64,');

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes('Absensi Digital'))).toBe(true);
      expect(texts.some((t) => t.includes('UNKNOWN') && t.includes('Anonymous'))).toBe(true);
    });

    it('MW-BND-05: Safely handles special characters without script execution or crashing', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      const xssPayload = "<script>alert('XSS')</script> & \"O'Connor\" 🚀";
      const dataUrl = await stampAttendanceWatermark(mockCanvas, {
        name: xssPayload,
        tenantName: "D'Arcy & Co. <LTD>",
      });

      expect(dataUrl).toBeDefined();
      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes(xssPayload))).toBe(true);
    });

    it('MW-BND-06: Handles media drawing errors by rendering dark slate fallback background', async () => {
      const brokenSource = {
        videoWidth: 640,
        videoHeight: 480,
      };

      const dataUrl = await stampAttendanceWatermark(brokenSource, { nik: 'EMP-001' });
      expect(dataUrl).toContain('data:image/jpeg;base64,');

      const ctx = getActiveMockContext();
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 640, 480);
    });

    it('MW-BND-07: Gracefully handles explicit null metadata argument without throwing TypeError', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 640;
      mockCanvas.height = 480;

      const dataUrl = await stampAttendanceWatermark(mockCanvas, null);
      expect(dataUrl).toContain('data:image/jpeg;base64,');

      const ctx = getActiveMockContext();
      const texts = ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts.some((t) => t.includes('Absensi Digital'))).toBe(true);
      expect(texts.some((t) => t.includes('UNKNOWN') && t.includes('Anonymous'))).toBe(true);
    });
  });

  // =========================================================================
  // Module 5: Photo Compression & Quota-Safe Storage Integration
  // =========================================================================
  describe('Module 5: Photo Compression & Quota-Safe Storage Integration', () => {
    it('MW-STO-01: Invokes canvas.toDataURL with image/jpeg and 0.7 quality factor', async () => {
      const mockCanvas = document.createElement('canvas');
      const toDataURLSpy = vi.spyOn(mockCanvas, 'toDataURL');

      await stampAttendanceWatermark(mockCanvas, {});

      expect(toDataURLSpy).toHaveBeenCalledWith('image/jpeg', 0.7);
    });

    it('MW-STO-02: Returns valid Base64 data URL string under 65,000 characters', async () => {
      const mockCanvas = document.createElement('canvas');
      const res = await stampAttendanceWatermark(mockCanvas, {});

      expect(typeof res).toBe('string');
      expect(res.startsWith('data:image/jpeg;base64,')).toBe(true);
      expect(res.length).toBeLessThan(65000);
    });

    it('MW-STO-03: Successfully saves attendance record via addAttendance and saveAttendanceRecord alias', () => {
      const testRecord = {
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        type: 'MASUK',
        status: 'Tepat Waktu',
        photoDataUrl: 'data:image/jpeg;base64,TEST_PHOTO_DATA',
      };

      const rec1 = addAttendance(testRecord);
      expect(rec1.id).toBeDefined();

      const rec2 = saveAttendanceRecord({ ...testRecord, userNik: 'EMP-002' });
      expect(rec2.id).toBeDefined();

      const stored = getAttendances();
      expect(stored.some((r) => r.userNik === 'EMP-001')).toBe(true);
      expect(stored.some((r) => r.userNik === 'EMP-002')).toBe(true);
    });

    it('MW-STO-04: Preserves isSimulator flag in persisted LocalStorage record', () => {
      const simRecord = saveAttendanceRecord({
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        type: 'MASUK',
        isSimulator: true,
      });

      expect(simRecord.isSimulator).toBe(true);

      const list = getAttendances();
      const found = list.find((r) => r.id === simRecord.id);
      expect(found).toBeDefined();
      expect(found.isSimulator).toBe(true);
    });

    it('MW-STO-05: Displays placeholder avatar when photo data is corrupted on error event', () => {
      setAttendances([
        {
          id: 'corrupt-test-1',
          userNik: 'EMP-001',
          userName: 'Ahmad Fauzi',
          date: '2026-11-24',
          time: '08:00:00',
          status: 'Tepat Waktu',
          photoDataUrl: 'data:image/jpeg;base64,GARBAGE_PAYLOAD',
        },
      ]);
      localStorage.setItem(
        'absensi_v1_current_user',
        JSON.stringify({ id: 'usr_emp001', nik: 'EMP-001', name: 'Ahmad Fauzi', role: 'karyawan' })
      );

      render(
        <TenantProvider>
          <AuthProvider>
            <AttendanceHistory />
          </AuthProvider>
        </TenantProvider>
      );

      const img = screen.getByRole('img');
      fireEvent.error(img);

      expect(screen.getByTestId('photo-placeholder-avatar')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Module 6: Attendance Modal Interactive Lifecycle (AttendanceModal)
  // =========================================================================
  describe('Module 6: Attendance Modal Interactive Lifecycle', () => {
    it('MW-MOD-01: Renders modal with geofence indicator and punctuality badge on open', () => {
      render(
        <TenantProvider>
          <AuthProvider>
            <AttendanceModal isOpen={true} type="MASUK" onClose={vi.fn()} />
          </AuthProvider>
        </TenantProvider>
      );

      expect(screen.getByTestId('geofence-status')).toBeInTheDocument();
      expect(screen.getByTestId('punctuality-status')).toBeInTheDocument();
      expect(screen.getByTestId('geofence-status')).toHaveTextContent('Dalam Radius Kantor');
    });

    it('MW-MOD-02: Accurately computes punctuality status (PULANG for evening checkout)', () => {
      render(
        <TenantProvider>
          <AuthProvider>
            <AttendanceModal isOpen={true} type="PULANG" onClose={vi.fn()} />
          </AuthProvider>
        </TenantProvider>
      );

      expect(screen.getByTestId('punctuality-status')).toHaveTextContent('PULANG');
    });

    it('MW-MOD-03: Clicking shutter transitions from viewfinder to watermark-preview-screen', async () => {
      const user = userEvent.setup();
      render(
        <TenantProvider>
          <AuthProvider>
            <AttendanceModal isOpen={true} type="MASUK" onClose={vi.fn()} />
          </AuthProvider>
        </TenantProvider>
      );

      const shutterBtn = screen.getByTestId('btn-camera-shutter');
      await user.click(shutterBtn);

      await waitFor(() => {
        expect(screen.getByTestId('watermark-preview-screen')).toBeInTheDocument();
      });
    });

    it('MW-MOD-04: Clicking Foto Ulang clears preview photo and restores live camera stream', async () => {
      const user = userEvent.setup();
      render(
        <TenantProvider>
          <AuthProvider>
            <AttendanceModal isOpen={true} type="MASUK" onClose={vi.fn()} />
          </AuthProvider>
        </TenantProvider>
      );

      const shutterBtn = screen.getByTestId('btn-camera-shutter');
      await user.click(shutterBtn);

      await waitFor(() => {
        expect(screen.getByTestId('watermark-preview-screen')).toBeInTheDocument();
      });

      const retakeBtn = screen.getByRole('button', { name: /foto ulang/i });
      await user.click(retakeBtn);

      expect(screen.queryByTestId('watermark-preview-screen')).not.toBeInTheDocument();
      expect(screen.getByTestId('btn-camera-shutter')).toBeInTheDocument();
    });

    it('MW-MOD-05: Clicking Kirim Presensi fires canvas-confetti celebration', async () => {
      const user = userEvent.setup();
      render(
        <TenantProvider>
          <AuthProvider>
            <AttendanceModal isOpen={true} type="MASUK" onClose={vi.fn()} />
          </AuthProvider>
        </TenantProvider>
      );

      await user.click(screen.getByTestId('btn-camera-shutter'));

      await waitFor(() => {
        expect(screen.getByTestId('btn-submit-attendance')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('btn-submit-attendance'));
      expect(confetti).toHaveBeenCalled();
    });

    it('MW-MOD-06: Dispatches onSuccess callback with persisted record and automatically closes', async () => {
      const user = userEvent.setup();
      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

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

      await user.click(screen.getByTestId('btn-camera-shutter'));

      await waitFor(() => {
        expect(screen.getByTestId('btn-submit-attendance')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('btn-submit-attendance'));

      await waitFor(
        () => {
          expect(handleSuccess).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'MASUK',
              photoDataUrl: expect.stringContaining('data:image/jpeg;base64,'),
            })
          );
          expect(handleClose).toHaveBeenCalled();
        },
        { timeout: 2500 }
      );
    });

    it('MW-MOD-07: Clicking Kirim Presensi multiple times during celebration creates exactly 1 record in LocalStorage (anti-spamming)', async () => {
      const user = userEvent.setup();
      const initialCount = getAttendances().length;

      render(
        <TenantProvider>
          <AuthProvider>
            <AttendanceModal isOpen={true} type="MASUK" onClose={vi.fn()} />
          </AuthProvider>
        </TenantProvider>
      );

      // Shutter click to enter preview screen
      await user.click(screen.getByTestId('btn-camera-shutter'));

      await waitFor(() => {
        expect(screen.getByTestId('btn-submit-attendance')).toBeInTheDocument();
      });

      const submitBtn = screen.getByTestId('btn-submit-attendance');

      // Rapidly trigger clicks during the window
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);

      const recordsAfterSpam = getAttendances();
      expect(recordsAfterSpam.length).toBe(initialCount + 1);
      expect(submitBtn).toBeDisabled();
    });

    it('MW-MOD-08: Accurately computes punctuality status with second-level precision (>08:00:00 is Terlambat)', () => {
      vi.useFakeTimers();
      try {
        // Test 08:00:00 (on time)
        vi.setSystemTime(new Date(2026, 10, 24, 8, 0, 0));
        const { unmount: unmount1 } = render(
          <TenantProvider>
            <AuthProvider>
              <AttendanceModal isOpen={true} type="MASUK" onClose={vi.fn()} />
            </AuthProvider>
          </TenantProvider>
        );
        expect(screen.getByTestId('punctuality-status')).toHaveTextContent('Tepat Waktu');
        unmount1();

        // Test 08:00:01 (late)
        vi.setSystemTime(new Date(2026, 10, 24, 8, 0, 1));
        const { unmount: unmount2 } = render(
          <TenantProvider>
            <AuthProvider>
              <AttendanceModal isOpen={true} type="MASUK" onClose={vi.fn()} />
            </AuthProvider>
          </TenantProvider>
        );
        expect(screen.getByTestId('punctuality-status')).toHaveTextContent('Terlambat');
        unmount2();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
