import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TenantSwitcher } from '@/components/common/TenantSwitcher.jsx';
import { Header } from '@/components/layout/Header.jsx';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm.jsx';
import { TenantProvider, useTenant } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { initStorage } from '@/utils/storage.js';

describe('Tier 2 - R5 Boundaries: Rapid Switching & Malformed Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T2-R5-01: Rapid Consecutive Tenant Preset Switching', async () => {
    const user = userEvent.setup();

    render(
      <TenantProvider>
        <TenantSwitcher />
      </TenantProvider>
    );

    const select = screen.getByTestId('tenant-select');

    // Rapid switches
    await user.selectOptions(select, 'pemerintah');
    await user.selectOptions(select, 'sekolah');
    await user.selectOptions(select, 'retail');
    await user.selectOptions(select, 'pemerintah');

    // Root style should cleanly match 'pemerintah' primary color (#15803D)
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#15803D');
  });

  it('T2-R5-02: Corrupted Preset ID in LocalStorage', () => {
    localStorage.setItem('absensi_v1_tenant', JSON.stringify('corrupted_unknown_preset'));

    function PresetChecker() {
      const { tenantId, currentTenant } = useTenant();
      return (
        <div>
          <div data-testid="resolved-preset-id">{tenantId}</div>
          <div data-testid="resolved-preset-name">{currentTenant.name}</div>
        </div>
      );
    }

    render(
      <TenantProvider>
        <PresetChecker />
      </TenantProvider>
    );

    // Fallbacks to default corporate preset cleanly
    expect(screen.getByTestId('resolved-preset-id')).toHaveTextContent('corporate');
    expect(screen.getByTestId('resolved-preset-name')).toHaveTextContent('PT Nusantara Jaya Mandiri');
  });

  it('T2-R5-03: Missing CSS Variable Fallback Resilience', () => {
    render(
      <TenantProvider>
        <div data-testid="css-token-probe">Active</div>
      </TenantProvider>
    );
    // Check that root style properties are defined with valid hex color
    const primary = document.documentElement.style.getPropertyValue('--color-primary');
    expect(primary).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('T2-R5-04: Dynamic Label Overflow in UI', () => {
    // Set active tenant to pemerintah (long name: "Badan Layanan Pemerintahan")
    localStorage.setItem('absensi_v1_tenant', JSON.stringify('pemerintah'));

    render(
      <TenantProvider>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </TenantProvider>
    );

    const header = screen.getByTestId('app-header');
    expect(header).toBeInTheDocument();

    const titleEl = screen.getByRole('heading', { level: 1 });
    expect(titleEl).toBeInTheDocument();
    expect(titleEl).toHaveTextContent('Badan Layanan Pemerintahan');
    expect(titleEl.className).toContain('truncate');
    expect(titleEl.className).toContain('max-w-');
  });

  it('T2-R5-05: Preset Switch During Active Form Input', async () => {
    const user = userEvent.setup();

    render(
      <TenantProvider>
        <AuthProvider>
          <div>
            <TenantSwitcher />
            <LeaveRequestForm />
          </div>
        </AuthProvider>
      </TenantProvider>
    );

    const reasonInput = screen.getByTestId('leave-reason-input');
    await user.type(reasonInput, 'Sedang mengetik alasan perizinan...');

    // Switch tenant preset to Pemerintah
    const select = screen.getByTestId('tenant-select');
    await user.selectOptions(select, 'pemerintah');

    // Input text preserved
    expect(reasonInput.value).toBe('Sedang mengetik alasan perizinan...');

    // Label updated to reflect "Alasan Pegawai"
    expect(screen.getByText('Alasan Pegawai')).toBeInTheDocument();
  });

  it('T2-R5-06: Cross-Tab Storage Event Synchronization', () => {
    function StorageListener() {
      const { tenantId } = useTenant();
      return (
        <div>
          <TenantSwitcher />
          <div data-testid="synced-tenant-id">{tenantId}</div>
        </div>
      );
    }

    render(
      <TenantProvider>
        <StorageListener />
      </TenantProvider>
    );

    expect(screen.getByTestId('synced-tenant-id')).toHaveTextContent('corporate');

    // Dispatch StorageEvent
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'absensi_v1_tenant',
          newValue: 'sekolah',
        })
      );
    });

    expect(screen.getByTestId('synced-tenant-id')).toHaveTextContent('sekolah');
  });
});
