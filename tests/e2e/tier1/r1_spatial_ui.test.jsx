import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import anime from 'animejs';

import { App } from '@/App.jsx';
import { LoginView } from '@/components/auth/LoginView.jsx';
import { SpatialCard } from '@/components/common/SpatialCard.jsx';
import { SpatialBackground } from '@/components/common/SpatialBackground.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider, useAuth } from '@/context/AuthContext.jsx';
import { initStorage } from '@/utils/storage.js';

describe('Tier 1 - R1: Spatial 3D UI, Anime.js, and Mobile-First Shell', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T1-R1-01: Login View Initial Rendering & Visual Elements', () => {
    render(
      <TenantProvider>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </TenantProvider>
    );

    // Expect login card container
    expect(screen.getByTestId('login-card')).toBeInTheDocument();

    // Expect Brand Logo / Crest SVG
    const logo = screen.getByTestId('brand-logo');
    expect(logo).toBeInTheDocument();
    expect(logo.querySelector('svg')).toBeDefined();

    // Expect Username/NIK and Password inputs
    expect(screen.getByLabelText(/nik/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kata sandi/i)).toBeInTheDocument();

    // Expect Demo Credentials pills
    expect(screen.getByTestId('demo-credentials')).toBeInTheDocument();

    // Expect spatial background
    expect(screen.getByTestId('spatial-background')).toBeInTheDocument();
  });

  it('T1-R1-02: Anime.js Entry Animation Sequencing', () => {
    const timelineSpy = vi.spyOn(anime, 'timeline');

    render(
      <TenantProvider>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </TenantProvider>
    );

    // Expect anime.timeline called at least once
    expect(timelineSpy).toHaveBeenCalled();
    timelineSpy.mockRestore();
  });

  it('T1-R1-03: ThreeUI SpatialCard Pointer Tilt & Specular Glare', () => {
    const { container } = render(
      <SpatialCard data-testid="test-spatial-card" maxTilt={15}>
        <div style={{ width: 400, height: 300 }}>Contoh Konten</div>
      </SpatialCard>
    );

    const card = screen.getByTestId('test-spatial-card');
    expect(card).toBeInTheDocument();

    // Mock getBoundingClientRect
    card.getBoundingClientRect = () => ({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
    });

    // Fire pointermove at bottom-right quadrant: clientX: 300, clientY: 250
    fireEvent.pointerMove(card, { clientX: 300, clientY: 250 });

    // Expect rotateX negative, rotateY positive
    expect(card.style.transform).toContain('perspective(1000px)');
    expect(card.style.transform).toContain('rotateX(');
    expect(card.style.transform).toContain('rotateY(');

    // Expect specular glare element opacity to increase
    const glare = screen.getByTestId('card-glare');
    expect(glare).toBeInTheDocument();
    expect(parseFloat(glare.style.opacity)).toBeGreaterThan(0);

    // Fire pointerleave -> resets transform
    fireEvent.pointerLeave(card);
    expect(card.style.transform).toBe('perspective(1000px) rotateX(0deg) rotateY(0deg)');
    expect(glare.style.opacity).toBe('0');
  });

  it('T1-R1-04: Demo Credentials Quick Fill & Login Authentication', async () => {
    const user = userEvent.setup();

    function TestApp() {
      const { isAuthenticated, currentUser } = useAuth();
      return (
        <div>
          <LoginView />
          <div data-testid="auth-state">
            {isAuthenticated ? `LOGGED_IN:${currentUser.role}:${currentUser.nik}` : 'NOT_LOGGED_IN'}
          </div>
        </div>
      );
    }

    render(
      <TenantProvider>
        <AuthProvider>
          <TestApp />
        </AuthProvider>
      </TenantProvider>
    );

    expect(screen.getByTestId('auth-state')).toHaveTextContent('NOT_LOGGED_IN');

    // Click demo credential pill for Karyawan
    const demoPills = screen.getAllByTestId('demo-pill-karyawan');
    await user.click(demoPills[0]);

    // Expect input value to populate
    const nikInput = screen.getByLabelText(/nik/i);
    expect(nikInput.value).toBe('EMP-001');

    // Click submit button
    const submitBtn = screen.getByTestId('btn-login-submit');
    await user.click(submitBtn);

    // Expect auth state updated
    expect(screen.getByTestId('auth-state')).toHaveTextContent('LOGGED_IN:karyawan:EMP-001');
  });

  it('T1-R1-05: Mobile-First Shell vs Desktop Layout Switching', async () => {
    // Authenticate user by pre-seeding current user session
    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        department: 'Engineering / IT',
      })
    );

    render(<App />);

    // BottomNav and Desktop Sidebar exist with responsive CSS classes
    const bottomNav = screen.getByTestId('bottom-nav');
    const desktopSidebar = screen.getByTestId('desktop-sidebar');

    expect(bottomNav).toBeInTheDocument();
    expect(desktopSidebar).toBeInTheDocument();

    // Verify responsive class assertions:
    // BottomNav has md:hidden
    expect(bottomNav.className).toContain('md:hidden');
    // Desktop sidebar has hidden md:flex
    expect(desktopSidebar.className).toContain('hidden');
    expect(desktopSidebar.className).toContain('md:flex');

    // Header renders digital clock
    expect(screen.getByTestId('digital-clock')).toBeInTheDocument();
  });

  it('T1-R1-06: Ambient Background Animation Loop Stability', () => {
    vi.useFakeTimers();

    const { container } = render(<SpatialBackground />);
    const bgElement = screen.getByTestId('spatial-background');
    expect(bgElement).toBeInTheDocument();

    // Advance time by 1000ms
    expect(() => {
      vi.advanceTimersByTime(1000);
    }).not.toThrow();

    vi.useRealTimers();
  });
});
