import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as XLSX from 'xlsx';

import { AttendanceRekap } from '@/components/admin/AttendanceRekap.jsx';
import { exportAttendanceToExcel } from '@/utils/excelExport.js';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { initStorage, setAttendances, setLeaves } from '@/utils/storage.js';

describe('Tier 1 - R4: Data Recapitulation & SheetJS Excel Export', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T1-R4-01: Recapitulation Table Rendering & Column Headers', () => {
    setAttendances([
      {
        id: 'rec-1',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        department: 'Engineering',
        date: '2026-11-24',
        time: '07:55:00',
        status: 'Tepat Waktu',
        coordinates: { address: 'Jakarta' },
        authHash: 'HASH123',
      },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    // Expect table headers
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Tanggal & Waktu')).toBeInTheDocument();
    expect(screen.getByText('Nama Lengkap')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Lokasi')).toBeInTheDocument();
    expect(screen.getByText('Verifikasi Hash')).toBeInTheDocument();

    // Expect row rendered
    expect(screen.getByTestId('recap-row-rec-1')).toBeInTheDocument();
  });

  it('T1-R4-02: Multi-Criteria Filtering by Department', async () => {
    const user = userEvent.setup();

    setAttendances([
      { id: 'it-1', userNik: '1', userName: 'User 1', department: 'Teknologi Informasi', date: '2026-11-20', status: 'Tepat Waktu' },
      { id: 'it-2', userNik: '2', userName: 'User 2', department: 'Teknologi Informasi', date: '2026-11-20', status: 'Tepat Waktu' },
      { id: 'it-3', userNik: '3', userName: 'User 3', department: 'Teknologi Informasi', date: '2026-11-20', status: 'Tepat Waktu' },
      { id: 'hr-1', userNik: '4', userName: 'User 4', department: 'HR & People Operations', date: '2026-11-20', status: 'Tepat Waktu' },
      { id: 'hr-2', userNik: '5', userName: 'User 5', department: 'HR & People Operations', date: '2026-11-20', status: 'Tepat Waktu' },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    // Filter by department "Teknologi Informasi"
    const deptSelect = screen.getByTestId('filter-department');
    await user.selectOptions(deptSelect, 'Teknologi Informasi');

    // Expect exactly 3 rows
    expect(screen.getByTestId('recap-row-it-1')).toBeInTheDocument();
    expect(screen.getByTestId('recap-row-it-2')).toBeInTheDocument();
    expect(screen.getByTestId('recap-row-it-3')).toBeInTheDocument();
    expect(screen.queryByTestId('recap-row-hr-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recap-row-hr-2')).not.toBeInTheDocument();
  });

  it('T1-R4-03: Multi-Criteria Filtering by Attendance Status', async () => {
    const user = userEvent.setup();

    setAttendances([
      { id: 'st-1', userNik: '1', userName: 'User 1', department: 'IT', date: '2026-11-20', status: 'Tepat Waktu' },
      { id: 'st-2', userNik: '2', userName: 'User 2', department: 'IT', date: '2026-11-20', status: 'Terlambat' },
      { id: 'st-3', userNik: '3', userName: 'User 3', department: 'IT', date: '2026-11-20', status: 'Terlambat' },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    const statusSelect = screen.getByTestId('filter-status');
    await user.selectOptions(statusSelect, 'Terlambat');

    expect(screen.queryByTestId('recap-row-st-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('recap-row-st-2')).toBeInTheDocument();
    expect(screen.getByTestId('recap-row-st-3')).toBeInTheDocument();
  });

  it('T1-R4-04: Date Range Filtering', async () => {
    const user = userEvent.setup();

    setAttendances([
      { id: 'd-1', userNik: '1', userName: 'User 1', department: 'IT', date: '2026-11-20', status: 'Tepat Waktu' },
      { id: 'd-2', userNik: '2', userName: 'User 2', department: 'IT', date: '2026-11-22', status: 'Tepat Waktu' },
      { id: 'd-3', userNik: '3', userName: 'User 3', department: 'IT', date: '2026-11-24', status: 'Tepat Waktu' },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    const startDateInput = screen.getByTestId('filter-start-date');
    const endDateInput = screen.getByTestId('filter-end-date');

    await user.type(startDateInput, '2026-11-21');
    await user.type(endDateInput, '2026-11-23');

    // Only d-2 (2026-11-22) should be visible
    expect(screen.queryByTestId('recap-row-d-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('recap-row-d-2')).toBeInTheDocument();
    expect(screen.queryByTestId('recap-row-d-3')).not.toBeInTheDocument();
  });

  it('T1-R4-05: SheetJS Excel Export Function Trigger', async () => {
    const user = userEvent.setup();

    setAttendances([
      { id: 'exp-1', userNik: 'EMP-001', userName: 'Ahmad Fauzi', department: 'IT', date: '2026-11-24', status: 'Tepat Waktu' },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    const exportBtn = screen.getByTestId('btn-export-excel');
    await user.click(exportBtn);

    // Expect URL.createObjectURL to have been called
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('T1-R4-06: Valid Binary Excel Output Format Verification', async () => {
    const sampleRecords = [
      {
        id: 'rec-test',
        userNik: '2024001',
        userName: 'Budi Santoso',
        department: 'Operasional',
        date: '2026-11-24',
        time: '07:55:00',
        status: 'Tepat Waktu',
        type: 'MASUK',
        authHash: 'HASH999',
      },
    ];

    const sampleLeaves = [
      {
        id: 'lve-test',
        userNik: '2024001',
        userName: 'Budi Santoso',
        type: 'cuti',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        durationDays: 3,
        reason: 'Keperluan keluarga',
        status: 'approved',
        reviewNotes: 'Disetujui',
      },
    ];

    const blob = exportAttendanceToExcel(sampleRecords, sampleLeaves, 'PT Teknologi');
    expect(blob).toBeDefined();

    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Verify ZIP magic numbers: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    expect(uint8[0]).toBe(0x50);
    expect(uint8[1]).toBe(0x4B);
    expect(uint8[2]).toBe(0x03);
    expect(uint8[3]).toBe(0x04);

    // Read workbook with SheetJS
    const wb = XLSX.read(arrayBuffer, { type: 'buffer' });
    expect(wb.SheetNames).toContain('Rekap Presensi');
    expect(wb.SheetNames).toContain('Rekap Perizinan');

    const presensiSheet = wb.Sheets['Rekap Presensi'];
    const rows = XLSX.utils.sheet_to_json(presensiSheet);
    expect(rows.length).toBe(1);
    expect(rows[0]['Nama Lengkap']).toBe('Budi Santoso');
  });
});
