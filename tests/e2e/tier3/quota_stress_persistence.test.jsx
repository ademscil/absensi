import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as XLSX from 'xlsx';

import { App } from '@/App.jsx';
import { exportAttendanceToExcel } from '@/utils/excelExport.js';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider, useAuth } from '@/context/AuthContext.jsx';
import {
  initStorage,
  getAttendances,
  setAttendances,
  addAttendance,
  safeSetItem,
  safeGetItem,
} from '@/utils/storage.js';
import { setSimulateQuotaError } from '../../setup.js';

describe('Tier 3 - Quota Stress, Storage Persistence & Cross-Feature Integrity', () => {
  beforeEach(() => {
    localStorage.clear();
    setSimulateQuotaError(false);
    initStorage(true);
  });

  it('T3-QUOTA-01: LocalStorage Quota Guard Stress Test', () => {
    // Generate 60 large attendance records with base64 photos (~1KB each for test)
    const largePhotos = Array.from({ length: 60 }, (_, i) => ({
      id: `att-stress-${i}`,
      userNik: `EMP-${i}`,
      userName: `Karyawan Stress ${i}`,
      date: '2026-11-24',
      status: 'Tepat Waktu',
      photoDataUrl: `data:image/jpeg;base64,${'A'.repeat(1200)}`,
    }));

    // Setting records through safe storage
    const success = safeSetItem('absensi_v1_attendances', largePhotos);
    expect(success).toBe(true);

    const saved = safeGetItem('absensi_v1_attendances', []);
    expect(saved.length).toBe(60);
  });

  it('T3-QUOTA-02: Graceful Degradation on Storage Exhaustion', () => {
    // Seed bulky attendances with long photoDataUrl to allow pruning
    const bulkyAttendances = Array.from({ length: 60 }, (_, i) => ({
      id: `att-bulky-${i}`,
      userNik: `EMP-${i}`,
      userName: `Employee ${i}`,
      status: 'Tepat Waktu',
      photoDataUrl: 'data:image/jpeg;base64,' + 'A'.repeat(2000),
    }));
    safeSetItem('absensi_v1_attendances', bulkyAttendances);

    // Mock setItem to throw QuotaExceededError on the initial write only
    let quotaThrown = false;
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, val) {
      if (!quotaThrown && key === 'test_quota_exhaust') {
        quotaThrown = true;
        const err = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        throw err;
      }
      return originalSetItem(key, val);
    });

    try {
      // safeSetItem handles QuotaExceededError, executes pruning, and succeeds
      const success = safeSetItem('test_quota_exhaust', { some: 'payload' });
      expect(success).toBe(true);

      const saved = safeGetItem('test_quota_exhaust');
      expect(saved).toEqual({ some: 'payload' });

      // Verify pruning was triggered on oldest attendances
      const attendances = safeGetItem('absensi_v1_attendances');
      expect(attendances.length).toBeGreaterThan(0);
      const prunedRecord = attendances[attendances.length - 1];
      expect(prunedRecord.photoDataUrl.length).toBeLessThan(500);
    } finally {
      setItemSpy.mockRestore();
    }
  });

  it('T3-EXPORT-01: Cross-Feature Recap Export Integrity', async () => {
    const attendanceRecord = {
      id: 'att-cross-1',
      userNik: 'EMP-001',
      userName: 'Ahmad Fauzi',
      department: 'Engineering',
      date: '2026-11-24',
      time: '07:55:00',
      type: 'MASUK',
      status: 'Tepat Waktu',
      authHash: 'AUTH_CROSS_888',
      coordinates: { address: 'Jakarta Digital Hub' },
    };

    const leaveRecord = {
      id: 'lve-cross-1',
      userNik: 'EMP-001',
      userName: 'Ahmad Fauzi',
      type: 'cuti',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      durationDays: 3,
      reason: 'Liburan tahunan resmi',
      status: 'approved',
      reviewNotes: 'Disetujui oleh Direktur Operasional',
    };

    const blob = exportAttendanceToExcel([attendanceRecord], [leaveRecord], 'Nusantara Corp');
    expect(blob).toBeDefined();

    const buffer = await blob.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'buffer' });

    // Validate Sheet 1 (Attendance)
    const ws1 = wb.Sheets['Rekap Presensi'];
    const rows1 = XLSX.utils.sheet_to_json(ws1);
    expect(rows1[0]['Verifikasi Hash']).toBe('AUTH_CROSS_888');

    // Validate Sheet 2 (Leave)
    const ws2 = wb.Sheets['Rekap Perizinan'];
    const rows2 = XLSX.utils.sheet_to_json(ws2);
    expect(rows2[0]['Reviewer / Catatan HR']).toBe('Disetujui oleh Direktur Operasional');
  });

  it('T3-AUTH-01: Role Switching State Integrity', async () => {
    const user = userEvent.setup();

    function RoleSwitchTest() {
      const { currentUser, role, login, logout, switchRole } = useAuth();
      return (
        <div>
          <div data-testid="current-role">{role || 'GUEST'}</div>
          <button
            type="button"
            data-testid="btn-login-karyawan"
            onClick={() => login({ nikOrEmail: 'EMP-001', password: 'password123' })}
          >
            Login Karyawan
          </button>
          <button type="button" data-testid="btn-logout-test" onClick={logout}>
            Logout
          </button>
          <button
            type="button"
            data-testid="btn-login-admin"
            onClick={() => login({ nikOrEmail: 'ADM-001', password: 'password123' })}
          >
            Login Admin
          </button>
        </div>
      );
    }

    render(
      <TenantProvider>
        <AuthProvider>
          <RoleSwitchTest />
        </AuthProvider>
      </TenantProvider>
    );

    // Initial
    expect(screen.getByTestId('current-role')).toHaveTextContent('GUEST');

    // Login as Karyawan
    await user.click(screen.getByTestId('btn-login-karyawan'));
    expect(screen.getByTestId('current-role')).toHaveTextContent('karyawan');

    // Logout
    await user.click(screen.getByTestId('btn-logout-test'));
    expect(screen.getByTestId('current-role')).toHaveTextContent('GUEST');

    // Login as Admin
    await user.click(screen.getByTestId('btn-login-admin'));
    expect(screen.getByTestId('current-role')).toHaveTextContent('admin');
  });
});
