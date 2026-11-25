import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AttendanceRekap } from '@/components/admin/AttendanceRekap.jsx';
import { exportAttendanceToExcel, sanitizeSheetName } from '@/utils/excelExport.js';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { setAttendances } from '@/utils/storage.js';

describe('Tier 2 - R4 Boundaries: Empty States & Sanitization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('T2-R4-01: Empty Recapitulation Table State', () => {
    setAttendances([]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    expect(
      screen.getByText('Belum ada data presensi yang tercatat')
    ).toBeInTheDocument();
  });

  it('T2-R4-02: Filter Yielding 0 Matching Records & Reset Filter', async () => {
    const user = userEvent.setup();

    setAttendances([
      { id: 'rec-1', userNik: '1', userName: 'Budi', department: 'Engineering', date: '2026-11-20', status: 'Tepat Waktu' },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    // Filter by conflicting status
    const statusSelect = screen.getByTestId('filter-status');
    await user.selectOptions(statusSelect, 'Terlambat');

    expect(
      screen.getByText('Tidak ditemukan data yang sesuai dengan kriteria filter')
    ).toBeInTheDocument();

    // Click "Reset Filter"
    const resetBtn = screen.getByTestId('btn-reset-filters');
    await user.click(resetBtn);

    // Expect row restored
    expect(screen.getByTestId('recap-row-rec-1')).toBeInTheDocument();
  });

  it('T2-R4-03: Special Characters & XSS Sanitization in Employee Names', () => {
    const dangerousName = '<script>alert(1)</script> & "O\'Connor"';
    setAttendances([
      {
        id: 'xss-1',
        userNik: 'XSS-001',
        userName: dangerousName,
        department: 'Engineering',
        date: '2026-11-24',
        status: 'Tepat Waktu',
      },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    // Verify rendered as plain text without executing script
    expect(screen.getByText(dangerousName)).toBeInTheDocument();

    // Verify Excel generation handles special chars safely
    const blob = exportAttendanceToExcel(
      [{ id: '1', userName: dangerousName, userNik: 'XSS-001' }],
      [],
      'Tenant & Partners <Corp>'
    );
    expect(blob).toBeDefined();
  });

  it('T2-R4-04: Large Dataset Recapitulation (1,000 Records)', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `rec-large-${i}`,
      userNik: `EMP-${String(i + 1).padStart(4, '0')}`,
      userName: `Karyawan ${i + 1}`,
      department: 'Engineering',
      date: '2026-11-24',
      status: 'Tepat Waktu',
    }));

    setAttendances(largeDataset);

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    // First page rendered promptly
    expect(screen.getByTestId('recap-row-rec-large-0')).toBeInTheDocument();
    // Pagination bar displays total pages (1000 / 15 = 67 pages)
    expect(screen.getByTestId('pagination-bar')).toHaveTextContent('Halaman 1 dari 67');
  });

  it('T2-R4-05: Excel Export on Zero-Record Filter Result', async () => {
    const user = userEvent.setup();
    setAttendances([]);

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceRekap />
        </AuthProvider>
      </TenantProvider>
    );

    const exportBtn = screen.getByTestId('btn-export-excel');
    await user.click(exportBtn);

    expect(alertSpy).toHaveBeenCalledWith('Tidak ada data untuk diekspor');
    alertSpy.mockRestore();
  });

  it('T2-R4-06: SheetJS Sheet Name Sanitization', () => {
    const invalidName = 'Retail / F&B : Jakarta * [Outlet 01]';
    const sanitized = sanitizeSheetName(invalidName);

    // Strips / : * [ ]
    expect(sanitized).not.toContain('/');
    expect(sanitized).not.toContain(':');
    expect(sanitized).not.toContain('*');
    expect(sanitized).not.toContain('[');
    expect(sanitized).not.toContain(']');
    expect(sanitized.length).toBeLessThanOrEqual(31);

    // Verify workbook export succeeds with sanitized sheet name
    const blob = exportAttendanceToExcel(
      [{ id: '1', userName: 'Test', date: '2026-11-24' }],
      [],
      invalidName
    );
    expect(blob).toBeDefined();
  });
});
