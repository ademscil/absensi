import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '@/App.jsx';
import { SpatialCard } from '@/components/common/SpatialCard.jsx';
import { LoginView } from '@/components/auth/LoginView.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { initStorage } from '@/utils/storage.js';

describe('Tier 2 - R1 Boundaries: Viewport Extremes & Transition Stresses', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T2-R1-01: Minimum Viewport 320px (iPhone SE Narrow) Layout', () => {
    window.innerWidth = 320;
    window.dispatchEvent(new Event('resize'));

    render(
      <TenantProvider>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </TenantProvider>
    );

    const submitBtn = screen.getByTestId('btn-login-submit');
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn.className).toContain('min-h-[44px]');
  });

  it('T2-R1-02: Ultra-Wide 4K Viewport (3840px) Centering', () => {
    window.innerWidth = 3840;
    window.dispatchEvent(new Event('resize'));

    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
      })
    );

    const { container } = render(<App />);

    // Expect max-w-7xl and mx-auto
    const mainWrapper = container.querySelector('.max-w-7xl');
    expect(mainWrapper).toBeInTheDocument();
    expect(mainWrapper.className).toContain('mx-auto');
  });

  it('T2-R1-03: Rapid Tab / Route Toggling During Transitions', async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
      })
    );

    render(<App />);

    const tabPresensi = screen.getByTestId('tab-presensi');
    const tabRiwayat = screen.getByTestId('tab-riwayat');
    const tabPengajuan = screen.getByTestId('tab-pengajuan');

    // Rapid toggle 10 times
    for (let i = 0; i < 3; i++) {
      await user.click(tabRiwayat);
      await user.click(tabPengajuan);
      await user.click(tabPresensi);
    }
    await user.click(tabPengajuan);

    // Final rendered view should match the last clicked tab consistently
    expect(screen.getByTestId('leave-request-form')).toBeInTheDocument();
  });

  it('T2-R1-04: Throttled / Missing Animation Callback Fallback', () => {
    // Delay or fail requestAnimationFrame
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = vi.fn();

    render(
      <TenantProvider>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </TenantProvider>
    );

    // Critical inputs and submit button are present
    expect(screen.getByLabelText(/nik/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kata sandi/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-login-submit')).toBeInTheDocument();

    window.requestAnimationFrame = originalRAF;
  });

  it('T2-R1-05: High Pointer Velocity / Multi-Touch Clamp on SpatialCard', () => {
    render(
      <SpatialCard data-testid="high-velocity-card" maxTilt={15}>
        <div>Konten</div>
      </SpatialCard>
    );

    const card = screen.getByTestId('high-velocity-card');

    card.getBoundingClientRect = () => ({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
    });

    // Fire pointermove with extreme out-of-bounds coordinates
    fireEvent.pointerMove(card, { clientX: 5000, clientY: -2000 });

    // Expect strictly clamped within [-15deg, +15deg]
    expect(card.style.transform).not.toContain('NaN');
    expect(card.style.transform).toMatch(/rotateX\(15(\.0+)?deg\)/);
    expect(card.style.transform).toMatch(/rotateY\(15(\.0+)?deg\)/);
  });

  it('T2-R1-06: Accessibility: Reduced Motion Preference', () => {
    // Mock matchMedia matches: true for prefers-reduced-motion
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <SpatialCard data-testid="reduced-motion-card">
        <div>Konten Aksesibilitas</div>
      </SpatialCard>
    );

    const card = screen.getByTestId('reduced-motion-card');

    // Fire pointermove
    fireEvent.pointerMove(card, { clientX: 300, clientY: 250 });

    // With reduced motion, transform remains 'none'
    expect(card.style.transform).toBe('none');

    window.matchMedia = originalMatchMedia;
  });
});
