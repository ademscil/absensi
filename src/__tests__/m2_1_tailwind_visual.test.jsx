import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TENANT_PRESETS } from '../data/tenantPresets.js';
import { TenantProvider } from '../context/TenantContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { LoginView } from '../components/auth/LoginView.jsx';
import { Header } from '../components/layout/Header.jsx';
import { LeaveRequestForm } from '../components/leave/LeaveRequestForm.jsx';
import { LeaveStatusList } from '../components/leave/LeaveStatusList.jsx';
import { AdminDashboard } from '../components/admin/AdminDashboard.jsx';
import { LeaveApprovalHub } from '../components/admin/LeaveApprovalHub.jsx';
import { initStorage, setAttendances, setLeaves } from '../utils/storage.js';
import tailwindConfig from '../../tailwind.config.js';
import postcssConfig from '../../postcss.config.js';

describe('Milestone 2.1: Tailwind CSS Engine & Visual Fidelity', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('configures PostCSS and Tailwind v3 with design token extensions', () => {
    expect(postcssConfig.plugins).toHaveProperty('tailwindcss');
    expect(postcssConfig.plugins).toHaveProperty('autoprefixer');

    expect(tailwindConfig.content).toContain('./index.html');
    expect(tailwindConfig.content).toContain('./src/**/*.{js,ts,jsx,tsx}');
    expect(tailwindConfig.theme.extend.colors).toEqual({
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      accent: 'var(--color-accent)',
    });
    expect(tailwindConfig.theme.extend.boxShadow).toEqual({
      glow: 'var(--shadow-glow)',
      'spatial-depth': 'var(--shadow-spatial-depth)',
    });
    expect(tailwindConfig.theme.extend.backgroundImage).toHaveProperty('radial-vignette');
    expect(tailwindConfig.theme.extend.keyframes).toHaveProperty('fade-in');
    expect(tailwindConfig.theme.extend.animation).toHaveProperty('fade-in');
  });

  it('layers index.css properly with @tailwind directives, @layer base, and .glass-panel', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent.startsWith("@import './designTokens.css';")).toBe(true);
    expect(cssContent).toContain('@tailwind base;');
    expect(cssContent).toContain('@tailwind components;');
    expect(cssContent).toContain('@tailwind utilities;');
    expect(cssContent).toContain('@layer base {');
    expect(cssContent).toContain('[data-testid="brand-logo"] svg');
    expect(cssContent).toContain('@layer components {');
    expect(cssContent).toContain('.glass-panel {');
  });

  it('constrains all 4 tenant preset logoSvg strings with explicit dimensions', () => {
    Object.values(TENANT_PRESETS).forEach((preset) => {
      expect(preset.logoSvg).toContain('width="48"');
      expect(preset.logoSvg).toContain('height="48"');
      expect(preset.logoSvg).toContain('max-w-full');
      expect(preset.logoSvg).toContain('max-h-full');
      expect(preset.logoSvg).toContain('object-contain');
    });
  });

  it('renders LoginView brand-logo with strict SVG containment classes', () => {
    render(
      <TenantProvider>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </TenantProvider>
    );

    const logoWrapper = screen.getByTestId('brand-logo');
    expect(logoWrapper.className).toContain('w-14');
    expect(logoWrapper.className).toContain('h-14');
    expect(logoWrapper.className).toContain('sm:w-16');
    expect(logoWrapper.className).toContain('sm:h-16');
    expect(logoWrapper.className).toContain('overflow-hidden');
    expect(logoWrapper.className).toContain('[&>svg]:w-full');
    expect(logoWrapper.className).toContain('[&>svg]:h-full');

    const svgEl = logoWrapper.querySelector('svg');
    expect(svgEl).not.toBeNull();
    expect(svgEl.getAttribute('width')).toBe('48');
    expect(svgEl.getAttribute('height')).toBe('48');
  });

  it('renders Header brand-logo and TenantSwitcher with mobile-safe truncation bounds', () => {
    render(
      <TenantProvider>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </TenantProvider>
    );

    const logoWrapper = screen.getByTestId('brand-logo');
    expect(logoWrapper.className).toContain('w-9');
    expect(logoWrapper.className).toContain('h-9');
    expect(logoWrapper.className).toContain('overflow-hidden');
    expect(logoWrapper.className).toContain('[&>svg]:w-full');

    const tenantSelect = screen.getByTestId('tenant-select');
    expect(tenantSelect.className).toContain('max-w-[112px]');
    expect(tenantSelect.className).toContain('truncate');
  });

  it('renders LeaveRequestForm date range inputs in a responsive grid-cols-1 sm:grid-cols-2 layout', () => {
    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveRequestForm />
        </AuthProvider>
      </TenantProvider>
    );

    const startDate = screen.getByTestId('leave-start-date');
    const gridWrapper = startDate.closest('.grid');
    expect(gridWrapper).not.toBeNull();
    expect(gridWrapper.className).toContain('grid-cols-1');
    expect(gridWrapper.className).toContain('sm:grid-cols-2');
  });

  it('orders -webkit-backdrop-filter before backdrop-filter in index.css glass classes', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    ['.mobile-shell', '.glass-panel', '.glass-card', '.glass-surface'].forEach((cls) => {
      const startIdx = cssContent.indexOf(`${cls} {`);
      expect(startIdx).toBeGreaterThan(-1);
      const block = cssContent.slice(startIdx, cssContent.indexOf('}', startIdx));
      const webkitIdx = block.indexOf('-webkit-backdrop-filter:');
      const stdIdx = block.indexOf('\n    backdrop-filter:');
      expect(webkitIdx).toBeGreaterThan(-1);
      expect(stdIdx).toBeGreaterThan(webkitIdx);
    });
  });

  it('wraps AdminDashboard live attendance simulator row without collapsing userName on narrow viewports', () => {
    initStorage(true);
    setAttendances([
      {
        id: 'att_sim_long',
        userId: 'usr_1',
        userName: 'Muhammad Abdurrahman Syaifullah Al-Fatih',
        userNik: 'EMP-999',
        tenantId: 'corporate',
        department: 'Engineering',
        date: '2026-11-25',
        time: '07:55:00',
        type: 'MASUK',
        status: 'Tepat Waktu',
        isSimulator: true,
        coordinates: { lat: -6.2, lng: 106.8, address: 'Jakarta' },
        authHash: 'hash123',
      },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </TenantProvider>
    );

    const feedItem = screen.getByTestId('feed-item-att_sim_long');
    const nameEl = screen.getByText('Muhammad Abdurrahman Syaifullah Al-Fatih');
    const simBadge = screen.getByTestId('simulator-warning-badge');
    const nameRow = nameEl.parentElement;

    expect(feedItem.className).toContain('min-w-0');
    expect(nameRow.className).toContain('flex-wrap');
    expect(nameRow.className).toContain('min-w-0');
    expect(nameEl.className).toContain('truncate');
    expect(nameEl.className).toContain('min-w-0');
    expect(nameEl.className).toContain('max-w-full');
    expect(simBadge).toBeInTheDocument();
  });

  it('constrains long attachment filenames in LeaveApprovalHub and LeaveStatusList without horizontal overflow', () => {
    initStorage(true);
    const longFilename = 'surat_keterangan_sakit_rs_pondok_indah_2026_11_25_very_long_filename.pdf';
    setLeaves([
      {
        id: 'lve_long_1',
        userId: 'usr_emp001',
        userName: 'Ahmad Fauzi',
        userNik: 'EMP-001',
        tenantId: 'corporate',
        department: 'Teknologi Informasi',
        type: 'sakit',
        typeLabel: 'Sakit',
        startDate: '2026-11-25',
        endDate: '2026-11-26',
        durationDays: 2,
        reason: 'Demam tinggi',
        attachmentName: longFilename,
        status: 'pending',
        submittedAt: '2026-11-25T01:00:00Z',
      },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveApprovalHub />
          <LeaveStatusList />
        </AuthProvider>
      </TenantProvider>
    );

    const statusAttachmentRow = screen.getByTestId('attachment-badge-lve_long_1');
    expect(statusAttachmentRow.className).toContain('min-w-0');
    expect(statusAttachmentRow.className).toContain('max-w-full');
    expect(statusAttachmentRow.className).toContain('flex-wrap');
    const statusFilenameSpan = statusAttachmentRow.querySelectorAll('span')[1];
    expect(statusFilenameSpan.className).toContain('min-w-0');
    expect(statusFilenameSpan.className).toContain('truncate');
    expect(statusFilenameSpan.className).toContain('break-all');
    expect(statusFilenameSpan.className).toContain('max-w-full');

    const approvalItem = screen.getByTestId('approval-item-lve_long_1');
    const approvalFilenameSpan = Array.from(approvalItem.querySelectorAll('span')).find(
      (el) => el.textContent === longFilename
    );
    expect(approvalFilenameSpan).toBeDefined();
    expect(approvalFilenameSpan.className).toContain('min-w-0');
    expect(approvalFilenameSpan.className).toContain('truncate');
    expect(approvalFilenameSpan.className).toContain('break-all');
    expect(approvalFilenameSpan.className).toContain('max-w-full');
    expect(approvalFilenameSpan.parentElement.className).toContain('min-w-0');
    expect(approvalFilenameSpan.parentElement.className).toContain('max-w-full');
    expect(approvalFilenameSpan.parentElement.className).toContain('flex-wrap');

    fireEvent.click(screen.getByTestId('btn-review-lve_long_1'));
    const modal = screen.getByTestId('approval-modal');
    const modalFilename = Array.from(modal.querySelectorAll('span')).find(
      (el) => el.textContent.includes(longFilename)
    );
    expect(modalFilename).toBeDefined();
    expect(modalFilename.className).toContain('break-all');
  });

  it('keeps LeaveRequestForm attachment preview pill bounded within narrow containers', () => {
    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveRequestForm />
        </AuthProvider>
      </TenantProvider>
    );

    const input = screen.getByTestId('leave-attachment-input');
    const longFile = new File(['dummy'], 'surat_keterangan_dokter_sangat_panjang_sekali_2026_11_25.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(input, { target: { files: [longFile] } });

    const preview = screen.getByTestId('leave-attachment-preview');
    expect(preview.className).toContain('max-w-full');
    expect(preview.className).toContain('min-w-0');

    const filenameSpan = preview.querySelectorAll('span')[1];
    expect(filenameSpan.className).toContain('min-w-0');
    expect(filenameSpan.className).toContain('flex-1');
    expect(filenameSpan.className).toContain('truncate');
    expect(filenameSpan.className).toContain('max-w-[160px]');
    expect(filenameSpan.className).toContain('sm:max-w-[200px]');
  });
});
