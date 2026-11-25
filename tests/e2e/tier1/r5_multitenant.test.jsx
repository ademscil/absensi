import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TenantSwitcher } from '@/components/common/TenantSwitcher.jsx';
import { Header } from '@/components/layout/Header.jsx';
import { TenantProvider, useTenant } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { TENANT_PRESETS } from '@/data/tenantPresets.js';
import { initStorage } from '@/utils/storage.js';

describe('Tier 1 - R5: Multi-Tenant & White-Label Preset Switcher', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T1-R5-01: Tenant Switcher UI & Preset Availability', () => {
    render(
      <TenantProvider>
        <TenantSwitcher />
      </TenantProvider>
    );

    const select = screen.getByTestId('tenant-select');
    expect(select).toBeInTheDocument();

    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toContain('Korporat Swasta');
    expect(options).toContain('Instansi Pemerintah');
    expect(options).toContain('Institusi Pendidikan');
    expect(options).toContain('Bisnis Retail & F&B');
  });

  it('T1-R5-02: Dynamic Color Palette & CSS Variables Injection', async () => {
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

    // Switch to Retail
    await user.selectOptions(select, 'retail');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#EA580C');
  });

  it('T1-R5-03: Domain-Specific Label Morphing', async () => {
    const user = userEvent.setup();

    function LabelWatcher() {
      const { labels } = useTenant();
      return (
        <div>
          <TenantSwitcher />
          <div data-testid="label-id">{labels.idLabel}</div>
          <div data-testid="label-user">{labels.userLabel}</div>
          <div data-testid="label-dept">{labels.deptLabel}</div>
        </div>
      );
    }

    render(
      <TenantProvider>
        <LabelWatcher />
      </TenantProvider>
    );

    const select = screen.getByTestId('tenant-select');

    // Act 1: Pemerintah
    await user.selectOptions(select, 'pemerintah');
    expect(screen.getByTestId('label-id')).toHaveTextContent('NIP');
    expect(screen.getByTestId('label-user')).toHaveTextContent('Pegawai');
    expect(screen.getByTestId('label-dept')).toHaveTextContent('Satuan Kerja');

    // Act 2: Sekolah
    await user.selectOptions(select, 'sekolah');
    expect(screen.getByTestId('label-id')).toHaveTextContent('NUPTK');
    expect(screen.getByTestId('label-user')).toHaveTextContent('Guru / Tenaga Pendidik');
    expect(screen.getByTestId('label-dept')).toHaveTextContent('Jurusan / Bidang');

    // Act 3: Retail
    await user.selectOptions(select, 'retail');
    expect(screen.getByTestId('label-id')).toHaveTextContent('Crew ID');
    expect(screen.getByTestId('label-user')).toHaveTextContent('Staff');
    expect(screen.getByTestId('label-dept')).toHaveTextContent('Cabang');
  });

  it('T1-R5-04: Dynamic Logo & Branding Crest Update', async () => {
    const user = userEvent.setup();

    render(
      <TenantProvider>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </TenantProvider>
    );

    const select = screen.getByTestId('tenant-select');
    const logoContainer = screen.getByTestId('brand-logo');

    // Default corporate logo
    expect(logoContainer.innerHTML).toContain('corp-grad');

    // Switch to pemerintah
    await user.selectOptions(select, 'pemerintah');
    expect(logoContainer.innerHTML).toContain('gov-grad');

    // Switch to sekolah
    await user.selectOptions(select, 'sekolah');
    expect(logoContainer.innerHTML).toContain('edu-grad');

    // Switch to retail
    await user.selectOptions(select, 'retail');
    expect(logoContainer.innerHTML).toContain('ret-grad');
  });

  it('T1-R5-05: Instantaneous Switch Without Page Reload', async () => {
    const user = userEvent.setup();

    function FormWithSwitcher() {
      const [text, setText] = React.useState('');
      return (
        <div>
          <TenantSwitcher />
          <input
            data-testid="preserve-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      );
    }

    render(
      <TenantProvider>
        <FormWithSwitcher />
      </TenantProvider>
    );

    // Type text into input
    const input = screen.getByTestId('preserve-input');
    await user.type(input, 'Data input sedang diketik');

    // Switch tenant
    const select = screen.getByTestId('tenant-select');
    await user.selectOptions(select, 'sekolah');

    // Expect input value preserved
    expect(input.value).toBe('Data input sedang diketik');
  });

  it('T1-R5-06: Tenant Preset Persistence in LocalStorage', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <TenantProvider>
        <TenantSwitcher />
      </TenantProvider>
    );

    const select = screen.getByTestId('tenant-select');
    await user.selectOptions(select, 'sekolah');

    // Verify localStorage value
    const stored = localStorage.getItem('absensi_v1_tenant');
    expect(stored).toContain('sekolah');

    unmount();

    // Re-mount TenantProvider; expect initial active preset to be 'sekolah'
    function PresetDisplay() {
      const { tenantId } = useTenant();
      return <div data-testid="active-preset">{tenantId}</div>;
    }

    render(
      <TenantProvider>
        <PresetDisplay />
      </TenantProvider>
    );

    expect(screen.getByTestId('active-preset')).toHaveTextContent('sekolah');
  });
});
