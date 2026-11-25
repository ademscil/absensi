import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SpatialCard, SpatialLayer } from '../components/common/SpatialCard.jsx';
import { SpatialBackground } from '../components/common/SpatialBackground.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { TenantSwitcher } from '../components/common/TenantSwitcher.jsx';
import { Header } from '../components/layout/Header.jsx';
import { BottomNav } from '../components/layout/BottomNav.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { LoginView } from '../components/auth/LoginView.jsx';
import {
  clampTiltAngle,
  animateLoginSequence,
  pulseButton,
  animateCheckmark,
  cancelAnimation,
} from '../utils/animations.js';
import { TenantProvider } from '../context/TenantContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { initStorage } from '../utils/storage.js';

describe('Milestone 2 Component & Interaction Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  describe('1. SpatialCard & ThreeUI Tilt Physics', () => {
    it('renders children with preserve-3d style and initial perspective', () => {
      render(
        <SpatialCard data-testid="test-card">
          <div data-testid="card-child">Konten Uji</div>
        </SpatialCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
      expect(screen.getByTestId('card-child')).toBeInTheDocument();
      expect(card.style.transformStyle).toBe('preserve-3d');
    });

    it('calculates tilt rotation and glare when pointer moves in bottom-right quadrant', () => {
      render(
        <SpatialCard data-testid="test-tilt-card" maxTilt={15}>
          <div style={{ width: 400, height: 300 }}>Area Uji</div>
        </SpatialCard>
      );

      const card = screen.getByTestId('test-tilt-card');
      card.getBoundingClientRect = () => ({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
      });

      // Pointer at bottom-right (300, 250): normX > 0, normY > 0 -> rotX < 0, rotY > 0
      fireEvent.pointerMove(card, { clientX: 300, clientY: 250 });

      expect(card.style.transform).toContain('perspective(1000px)');
      expect(card.style.transform).toContain('rotateX(');
      expect(card.style.transform).toContain('rotateY(');
      expect(card.style.transform).toContain('scale3d(1.02, 1.02, 1.02)');

      const glare = screen.getByTestId('card-glare');
      expect(glare).toBeInTheDocument();
      expect(parseFloat(glare.style.opacity)).toBeGreaterThan(0);
    });

    it('calculates tilt rotation when pointer moves in top-left quadrant', () => {
      render(
        <SpatialCard data-testid="test-tilt-card-tl" maxTilt={15}>
          <div style={{ width: 400, height: 300 }}>Area Uji Top Left</div>
        </SpatialCard>
      );

      const card = screen.getByTestId('test-tilt-card-tl');
      card.getBoundingClientRect = () => ({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
      });

      // Pointer at top-left (100, 50): normX < 0, normY < 0 -> rotX > 0, rotY < 0
      fireEvent.pointerMove(card, { clientX: 100, clientY: 50 });

      expect(card.style.transform).toContain('perspective(1000px)');
      expect(card.style.transform).toContain('scale3d(1.02, 1.02, 1.02)');
    });

    it('resets transform to neutral perspective and hides glare on pointer leave', () => {
      render(
        <SpatialCard data-testid="test-leave-card">
          <div style={{ width: 400, height: 300 }}>Area Uji Reset</div>
        </SpatialCard>
      );

      const card = screen.getByTestId('test-leave-card');
      card.getBoundingClientRect = () => ({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
      });

      fireEvent.pointerMove(card, { clientX: 300, clientY: 250 });
      fireEvent.pointerLeave(card);

      expect(card.style.transform).toBe('perspective(1000px) rotateX(0deg) rotateY(0deg)');
      const glare = screen.getByTestId('card-glare');
      expect(glare.style.opacity).toBe('0');
    });

    it('supports SpatialLayer for translateZ multi-layer depth stacking', () => {
      render(
        <SpatialCard data-testid="test-layered-card">
          <SpatialLayer depth={35} data-testid="layer-1">
            <span>Layer Depan 35px</span>
          </SpatialLayer>
          <SpatialLayer depth={15} data-testid="layer-2">
            <span>Layer Tengah 15px</span>
          </SpatialLayer>
        </SpatialCard>
      );

      const layer1 = screen.getByTestId('layer-1');
      const layer2 = screen.getByTestId('layer-2');

      expect(layer1.style.transform).toBe('translateZ(35px)');
      expect(layer2.style.transform).toBe('translateZ(15px)');
      expect(layer1.style.transformStyle).toBe('preserve-3d');
    });

    it('gracefully handles touch devices without breaking layout', () => {
      render(
        <SpatialCard data-testid="test-touch-card">
          <div>Touch Content</div>
        </SpatialCard>
      );

      const card = screen.getByTestId('test-touch-card');
      // Fire touch pointer event
      fireEvent.pointerMove(card, { pointerType: 'touch', clientX: 200, clientY: 200 });
      // Should remain at initial neutral orientation
      expect(card.style.transform).toBe('perspective(1000px) rotateX(0deg) rotateY(0deg)');
    });
  });

  describe('2. SpatialBackground Component', () => {
    it('renders background canvas and overlay container', () => {
      render(<SpatialBackground data-testid="test-spatial-bg" />);
      const bg = screen.getByTestId('test-spatial-bg');
      expect(bg).toBeInTheDocument();
      expect(bg.querySelector('canvas')).toBeInTheDocument();
    });

    it('responds to window pointermove without throwing', () => {
      render(<SpatialBackground />);
      expect(() => {
        fireEvent.pointerMove(window, { clientX: 250, clientY: 300 });
      }).not.toThrow();
    });

    it('handles window resize and cleans up animation frame on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      const { unmount } = render(<SpatialBackground />);

      fireEvent(window, new Event('resize'));
      unmount();

      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
    });
  });

  describe('3. Badge Component Variants & Transitions', () => {
    it('renders with explicit variants: success, warning, danger, neutral, primary', () => {
      const { rerender } = render(<Badge variant="success">Berhasil</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-emerald-300');

      rerender(<Badge variant="warning">Peringatan</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-amber-300');

      rerender(<Badge variant="danger">Ditolak</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-rose-300');

      rerender(<Badge variant="neutral">Netral</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-slate-300');

      rerender(<Badge variant="primary">Utama</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-sky-300');
    });

    it('automatically determines variant from semantic Indonesian status text', () => {
      const { rerender } = render(<Badge>Tepat Waktu</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-emerald-300');

      rerender(<Badge>Terlambat 15 Menit</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-rose-300');

      rerender(<Badge>Permohonan Cuti Tahunan</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-amber-300');

      rerender(<Badge>Mode Simulator Aktif</Badge>);
      expect(screen.getByTestId('status-badge').className).toContain('text-purple-300');
    });
  });

  describe('4. Modal Component Accessibility & Interaction', () => {
    it('does not render content when isOpen is false', () => {
      render(
        <Modal isOpen={false} title="Dialog Uji">
          <div>Konten Tersembunyi</div>
        </Modal>
      );
      expect(screen.queryByTestId('app-modal')).not.toBeInTheDocument();
    });

    it('renders accessible dialog with title and children when isOpen is true', () => {
      render(
        <Modal isOpen={true} title="Konfirmasi Presensi">
          <div data-testid="modal-content">Foto berhasil diverifikasi</div>
        </Modal>
      );

      const modal = screen.getByTestId('app-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('Konfirmasi Presensi')).toBeInTheDocument();
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Uji ESC">
          <div>Tekan ESC</div>
        </Modal>
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Uji Tombol Tutup">
          <div>Isi Modal</div>
        </Modal>
      );

      const closeBtn = screen.getByLabelText('Tutup Modal');
      await user.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Anime.js Animation Utilities', () => {
    it('clampTiltAngle clamps angles strictly within bounds and handles non-numbers', () => {
      expect(clampTiltAngle(10, -15, 15)).toBe(10);
      expect(clampTiltAngle(25, -15, 15)).toBe(15);
      expect(clampTiltAngle(-30, -15, 15)).toBe(-15);
      expect(clampTiltAngle(NaN)).toBe(0);
      expect(clampTiltAngle('invalid')).toBe(0);
    });

    it('animateLoginSequence builds timeline and returns instance without throwing', () => {
      const header = document.createElement('div');
      const brandCrest = document.createElement('div');
      const formCard = document.createElement('div');
      const submitBtn = document.createElement('button');

      let tl;
      expect(() => {
        tl = animateLoginSequence(null, {
          header,
          brandCrest,
          formCard,
          submitBtn,
        });
      }).not.toThrow();

      expect(tl).toBeDefined();
    });

    it('pulseButton micro-interaction executes without error', () => {
      const btn = document.createElement('button');
      let anim;
      expect(() => {
        anim = pulseButton(btn);
      }).not.toThrow();
      expect(anim).toBeDefined();
    });

    it('animateCheckmark executes SVG stroke animation without error', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let anim;
      expect(() => {
        anim = animateCheckmark(path, 500);
      }).not.toThrow();
      expect(anim).toBeDefined();
    });

    it('cancelAnimation handles pausing and cleanup safely', () => {
      const mockAnim = {
        pause: vi.fn(),
        targets: [document.createElement('div')],
      };
      expect(() => cancelAnimation(mockAnim)).not.toThrow();
      expect(mockAnim.pause).toHaveBeenCalled();
      expect(() => cancelAnimation(null)).not.toThrow();
    });
  });

  describe('6. TenantSwitcher Preset Switching & Theme Transition', () => {
    it('renders all four tenant options and shows active preset indicator', () => {
      render(
        <TenantProvider>
          <TenantSwitcher />
        </TenantProvider>
      );

      const select = screen.getByTestId('tenant-select');
      expect(select).toBeInTheDocument();

      const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
      expect(options).toEqual([
        'Korporat Swasta',
        'Instansi Pemerintah',
        'Institusi Pendidikan',
        'Bisnis Retail & F&B',
      ]);

      const indicator = screen.getByTestId('active-preset-indicator');
      expect(indicator).toBeInTheDocument();
      expect(screen.getByTestId('active-preset-dot')).toBeInTheDocument();
    });

    it('switches preset, updates theme color variables, and updates visual indicator', async () => {
      const user = userEvent.setup();
      render(
        <TenantProvider>
          <TenantSwitcher />
        </TenantProvider>
      );

      const select = screen.getByTestId('tenant-select');

      // Switch to Pemerintah
      await user.selectOptions(select, 'pemerintah');
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#15803D');
      expect(screen.getByTestId('active-preset-indicator')).toHaveTextContent(/Badan Layanan Pemerintahan/i);

      // Switch to Sekolah
      await user.selectOptions(select, 'sekolah');
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#7C3AED');
      expect(screen.getByTestId('active-preset-indicator')).toHaveTextContent(/Akademi Bangsa Indonesia/i);

      // Switch to Retail
      await user.selectOptions(select, 'retail');
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#EA580C');
      expect(screen.getByTestId('active-preset-indicator')).toHaveTextContent(/Kopi Senja/i);
    });
  });

  describe('7. Header Component Live Clock & Brand Identity', () => {
    it('renders live Indonesian clock formatted as HH:mm:ss WIB', () => {
      render(
        <TenantProvider>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </TenantProvider>
      );

      const clock = screen.getByTestId('digital-clock');
      expect(clock).toBeInTheDocument();
      expect(clock.textContent).toMatch(/^\d{2}:\d{2}:\d{2} WIB$/);
    });

    it('cleans up clock timer on unmount', () => {
      const clearSpy = vi.spyOn(window, 'clearInterval');
      const { unmount } = render(
        <TenantProvider>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </TenantProvider>
      );

      unmount();
      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it('displays tenant brand logo and name', () => {
      render(
        <TenantProvider>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </TenantProvider>
      );

      expect(screen.getByTestId('brand-logo')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/PT Nusantara Jaya Mandiri/i);
    });
  });

  describe('8. BottomNav & Sidebar Tab Navigation', () => {
    function MockAuthWrapper({ children }) {
      return (
        <TenantProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TenantProvider>
      );
    }

    it('BottomNav renders Karyawan navigation tabs and triggers onTabChange', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();

      render(
        <MockAuthWrapper role="karyawan">
          <BottomNav activeTab="presensi" onTabChange={handleTabChange} />
        </MockAuthWrapper>
      );

      const tabPresensi = screen.getByTestId('tab-presensi');
      const tabRiwayat = screen.getByTestId('tab-riwayat');
      const tabPengajuan = screen.getByTestId('tab-pengajuan');

      expect(tabPresensi).toBeInTheDocument();
      expect(tabRiwayat).toBeInTheDocument();
      expect(tabPengajuan).toBeInTheDocument();

      await user.click(tabRiwayat);
      expect(handleTabChange).toHaveBeenCalledWith('riwayat');
    });

    it('Sidebar renders responsive desktop links and active highlight', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();

      render(
        <MockAuthWrapper role="karyawan">
          <Sidebar activeTab="presensi" onTabChange={handleTabChange} />
        </MockAuthWrapper>
      );

      const sidebar = screen.getByTestId('desktop-sidebar');
      expect(sidebar.className).toContain('hidden');
      expect(sidebar.className).toContain('md:flex');

      const linkRiwayat = screen.getByTestId('sidebar-link-riwayat');
      await user.click(linkRiwayat);
      expect(handleTabChange).toHaveBeenCalledWith('riwayat');
    });
  });

  describe('9. LoginView & Demo Credentials Interaction', () => {
    it('renders role toggle selector and switches between Karyawan and Admin HR', async () => {
      const user = userEvent.setup();

      render(
        <TenantProvider>
          <AuthProvider>
            <LoginView />
          </AuthProvider>
        </TenantProvider>
      );

      const toggleKaryawan = screen.getByTestId('role-toggle-karyawan');
      const toggleAdmin = screen.getByTestId('role-toggle-admin');

      expect(toggleKaryawan).toBeInTheDocument();
      expect(toggleAdmin).toBeInTheDocument();

      // Click Admin toggle
      await user.click(toggleAdmin);
      expect(toggleAdmin.className).toContain('bg-purple-600');

      // Click Karyawan toggle
      await user.click(toggleKaryawan);
      expect(toggleKaryawan.className).toContain('bg-primary');
    });

    it('clicking demo pills populates NIK and password fields', async () => {
      const user = userEvent.setup();

      render(
        <TenantProvider>
          <AuthProvider>
            <LoginView />
          </AuthProvider>
        </TenantProvider>
      );

      const demoPills = screen.getAllByTestId('demo-pill-karyawan');
      await user.click(demoPills[0]);

      const nikInput = screen.getByLabelText(/nik/i);
      const passwordInput = screen.getByLabelText(/kata sandi/i);

      expect(nikInput.value).toBe('EMP-001');
      expect(passwordInput.value).toBe('password123');
    });

    it('shows error alert when invalid login credentials are submitted', async () => {
      const user = userEvent.setup();

      render(
        <TenantProvider>
          <AuthProvider>
            <LoginView />
          </AuthProvider>
        </TenantProvider>
      );

      const nikInput = screen.getByLabelText(/nik/i);
      const passwordInput = screen.getByLabelText(/kata sandi/i);
      const submitBtn = screen.getByTestId('btn-login-submit');

      await user.clear(nikInput);
      await user.type(nikInput, 'INVALID_USER');
      await user.clear(passwordInput);
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitBtn);

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/tidak ditemukan|gagal/i);
    });
  });
});
