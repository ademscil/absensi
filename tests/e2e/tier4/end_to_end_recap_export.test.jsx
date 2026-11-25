import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as XLSX from 'xlsx';

import { AttendanceRekap } from '@/components/admin/AttendanceRekap.jsx';
import { TenantSwitcher } from '@/components/common/TenantSwitcher.jsx';
import { stampAttendanceWatermark } from '@/utils/canvasWatermark.js';
import { exportAttendanceToExcel } from '@/utils/excelExport.js';
import { TenantProvider, useTenant } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import {
  initStorage,
  getAttendances,
  setAttendances,
  addAttendance,
} from '@/utils/storage.js';

describe('Tier 4 - Workflow 3: End-to-End Recap, Filtering & Excel Export', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T4-E2E-05: Multi-Employee Attendance, Multi-Criteria Filtering & Excel Generation', async () => {
    const user = userEvent.setup();

    // Seed 8 check-ins across Engineering, Marketing, HR (5 on time, 3 late)
    const seeded = [
      { id: 'att-1', userNik: 'EMP-001', userName: 'Ahmad Fauzi', department: 'Engineering', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'att-2', userNik: 'EMP-002', userName: 'Dewi Lestari', department: 'Marketing', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'att-3', userNik: 'EMP-003', userName: 'Budi Santoso', department: 'Operations', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'att-4', userNik: 'EMP-004', userName: 'Rina Wijaya', department: 'Finance', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'att-5', userNik: 'EMP-005', userName: 'Eko Prasetyo', department: 'Engineering', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'att-6', userNik: 'EMP-006', userName: 'Fajar Nugraha', department: 'Engineering', date: '2026-11-24', status: 'Terlambat' },
      { id: 'att-7', userNik: 'EMP-007', userName: 'Gita Permata', department: 'Marketing', date: '2026-11-24', status: 'Terlambat' },
      { id: 'att-8', userNik: 'EMP-008', userName: 'Hadi Gunawan', department: 'Engineering', date: '2026-11-24', status: 'Terlambat' },
    ];
    setAttendances(seeded);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    // Initial table has all 8 rows
    expect(screen.getByTestId('recap-row-att-1')).toBeInTheDocument();
    expect(screen.getByTestId('recap-row-att-8')).toBeInTheDocument();

    // Filter by Department: Engineering
    const deptSelect = screen.getByTestId('filter-department');
    await user.selectOptions(deptSelect, 'Engineering');

    // Filter by Status: Terlambat
    const statusSelect = screen.getByTestId('filter-status');
    await user.selectOptions(statusSelect, 'Terlambat');

    // Matching rows: att-6 (Fajar) and att-8 (Hadi)
    expect(screen.getByTestId('recap-row-att-6')).toBeInTheDocument();
    expect(screen.getByTestId('recap-row-att-8')).toBeInTheDocument();
    expect(screen.queryByTestId('recap-row-att-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recap-row-att-7')).not.toBeInTheDocument();

    // Reset filters
    const startDateInput = screen.getByTestId('filter-start-date');
    await user.click(screen.getByTestId('btn-export-excel'));

    // Download triggered
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('T4-E2E-06: Enterprise Multi-Tenant Rebranding & Operational Continuity', async () => {
    const user = userEvent.setup();

    // 1. Corporate employee check-in
    addAttendance({
      id: 'att-flow-corp',
      userNik: '2024001',
      userName: 'Budi Santoso',
      tenantId: 'corporate',
      department: 'Engineering',
      status: 'Tepat Waktu',
    });

    function RebrandFlowApp() {
      const { labels, currentTenant } = useTenant();
      return (
        <div>
          <TenantSwitcher />
          <div data-testid="app-brand-name">{currentTenant.name}</div>
          <div data-testid="app-id-label">{labels.idLabel}</div>
          <div data-testid="app-user-label">{labels.userLabel}</div>
          <div data-testid="app-dept-label">{labels.deptLabel}</div>
        </div>
      );
    }

    render(
      <TenantProvider>
        <AuthProvider>
          <RebrandFlowApp />
        </AuthProvider>
      </TenantProvider>
    );

    // 2. Administrator switches preset to Instansi Pemerintah
    const select = screen.getByTestId('tenant-select');
    await user.selectOptions(select, 'pemerintah');

    // 3. Theme transitions to Emerald Green and branding updates
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#15803D');
    expect(screen.getByTestId('app-brand-name')).toHaveTextContent('Badan Layanan Pemerintahan');

    // 4. Form labels morph
    expect(screen.getByTestId('app-id-label')).toHaveTextContent('NIP');
    expect(screen.getByTestId('app-user-label')).toHaveTextContent('Pegawai');
    expect(screen.getByTestId('app-dept-label')).toHaveTextContent('Satuan Kerja');

    // 5. ASN check-in with NIP
    addAttendance({
      id: 'att-flow-gov',
      userNik: '198005122005011002',
      userName: 'Dr. Rahmat Hidayat, M.Si',
      tenantId: 'pemerintah',
      department: 'Satuan Kerja Kepegawaian',
      status: 'Tepat Waktu',
    });

    // 6. Watermark stamping with new tenant metadata
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 640;
    mockCanvas.height = 480;

    const dataUrl = await stampAttendanceWatermark(mockCanvas, {
      idLabel: 'NIP',
      nik: '198005122005011002',
      name: 'Dr. Rahmat Hidayat, M.Si',
      tenantName: 'Badan Layanan Pemerintahan',
      department: 'Satuan Kerja Kepegawaian',
      status: 'Tepat Waktu',
      type: 'MASUK',
    });

    expect(dataUrl).toContain('data:image/jpeg;base64,');

    // 7. Verify both records exist in storage without pollution
    const all = getAttendances();
    expect(all.some((a) => a.id === 'att-flow-corp')).toBe(true);
    expect(all.some((a) => a.id === 'att-flow-gov')).toBe(true);
  });
});
