import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import confetti from 'canvas-confetti';

import { App } from '@/App.jsx';
import { AdminDashboard } from '@/components/admin/AdminDashboard.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { initStorage, getAttendances } from '@/utils/storage.js';

describe('Tier 4 - Workflow 1: Full Day Attendance Lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T4-E2E-01: Morning Check-In to Evening Check-Out Workflow', async () => {
    const user = userEvent.setup();

    render(<App />);

    // Step 1: Login via Demo Credentials for Karyawan
    const demoPills = screen.getAllByTestId('demo-pill-karyawan');
    await user.click(demoPills[0]);

    const submitBtn = screen.getByTestId('btn-login-submit');
    await user.click(submitBtn);

    // Step 2: Dashboard mounts
    await waitFor(() => {
      expect(screen.getByTestId('btn-open-masuk')).toBeInTheDocument();
    });

    // Step 3: Open Attendance Modal (MASUK)
    await user.click(screen.getByTestId('btn-open-masuk'));
    expect(screen.getByTestId('attendance-modal')).toBeInTheDocument();

    // Step 4: Shutter capture
    const shutterBtn = screen.getByTestId('btn-camera-shutter');
    await user.click(shutterBtn);

    // Step 5: Watermark preview screen appears
    await waitFor(() => {
      expect(screen.getByTestId('watermark-preview-screen')).toBeInTheDocument();
    });

    // Step 6: Confirm submit
    const confirmBtn = screen.getByTestId('btn-submit-attendance');
    await user.click(confirmBtn);

    // Verify confetti fired
    expect(confetti).toHaveBeenCalled();

    // Step 7: Wait for modal to dismiss after celebration
    await waitFor(
      () => {
        expect(screen.queryByTestId('attendance-modal')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Step 8: Open Attendance Modal for Evening (PULANG)
    await user.click(screen.getByTestId('btn-open-pulang'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Presensi Pulang/i })).toBeInTheDocument();
    });

    // Shutter & confirm Pulang
    const pulangShutter = screen.getByTestId('btn-camera-shutter');
    await user.click(pulangShutter);

    await waitFor(() => {
      expect(screen.getByTestId('watermark-preview-screen')).toBeInTheDocument();
    });

    const confirmPulangBtn = screen.getByTestId('btn-submit-attendance');
    await user.click(confirmPulangBtn);

    // Both MASUK and PULANG persisted
    await waitFor(() => {
      const records = getAttendances();
      const hasMasuk = records.some((r) => r.type === 'MASUK');
      const hasPulang = records.some((r) => r.type === 'PULANG');
      expect(hasMasuk).toBe(true);
      expect(hasPulang).toBe(true);
    });
  });

  it('T4-E2E-02: Field Worker Emergency Simulator Attendance', async () => {
    const user = userEvent.setup();

    // Deny camera hardware
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
      new DOMException('Camera denied by device policy', 'NotAllowedError')
    );

    // Logged in as field employee
    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp003',
        nik: 'EMP-003',
        name: 'Budi Santoso',
        role: 'karyawan',
        department: 'Operations',
      })
    );

    const { unmount } = render(<App />);

    // Open check-in modal
    await user.click(screen.getByTestId('btn-open-masuk'));

    // Expect simulator alert & activate simulator
    await waitFor(() => {
      expect(screen.getByTestId('simulator-banner')).toBeInTheDocument();
    });

    // Shutter capture in simulator mode
    const shutter = screen.getByTestId('btn-camera-shutter');
    await user.click(shutter);

    // Confirm submit
    await waitFor(() => {
      expect(screen.getByTestId('watermark-preview-screen')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('btn-submit-attendance'));

    // Record has isSimulator: true
    await waitFor(() => {
      const records = getAttendances();
      const simRec = records.find((r) => r.userNik === 'EMP-003' && r.isSimulator === true);
      expect(simRec).toBeDefined();
    });

    unmount();

    // Admin HR views live feed -> displays [SIMULATOR] warning badge
    render(
      <TenantProvider>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </TenantProvider>
    );

    expect(screen.getByTestId('simulator-warning-badge')).toHaveTextContent('[SIMULATOR]');
  });
});
