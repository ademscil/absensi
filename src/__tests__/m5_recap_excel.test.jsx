/**
 * Milestone 5 Comprehensive Unit & Integration Test Suite
 * Data Recapitulation (AttendanceRekap) & Client-Side Excel Export (.xlsx)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as XLSX from 'xlsx';

import { AttendanceRekap } from '@/components/admin/AttendanceRekap.jsx';
import { exportAttendanceToExcel, sanitizeSheetName } from '@/utils/excelExport.js';
import { App } from '@/App.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import {
  initStorage,
  setAttendances,
  setLeaves,
  setUsers,
  setCurrentUser,
} from '@/utils/storage.js';

function renderWithProviders(ui) {
  return render(
    <TenantProvider>
      <AuthProvider>{ui}</AuthProvider>
    </TenantProvider>
  );
}

const sampleUsers = [
  {
    id: 'usr_adm_1',
    nik: 'ADM-001',
    name: 'Siti Rahma',
    role: 'admin',
    tenantId: 'corporate',
    department: 'HR',
  },
  {
    id: 'usr_1',
    nik: 'EMP-101',
    name: 'Budi Pratama',
    role: 'karyawan',
    tenantId: 'corporate',
    department: 'Engineering',
  },
  {
    id: 'usr_2',
    nik: 'EMP-102',
    name: 'Citra Kirana',
    role: 'karyawan',
    tenantId: 'corporate',
    department: 'Finance',
  },
  {
    id: 'usr_3',
    nik: 'EMP-103',
    name: 'Dian Sastro',
    role: 'karyawan',
    tenantId: 'corporate',
    department: 'Operations',
  },
];

const sampleAttendances = [
  {
    id: 'm5-att-1',
    userId: 'usr_1',
    userNik: 'EMP-101',
    userName: 'Budi Pratama',
    department: 'Engineering',
    date: '2026-11-20',
    time: '07:45:00',
    type: 'MASUK',
    status: 'Tepat Waktu',
    coordinates: { lat: -6.2, lng: 106.8, address: 'Jakarta Pusat' },
    authHash: 'HASH001',
  },
  {
    id: 'm5-att-2',
    userId: 'usr_2',
    userNik: 'EMP-102',
    userName: 'Citra Kirana',
    department: 'Finance',
    date: '2026-11-21',
    time: '08:20:00',
    type: 'MASUK',
    status: 'Terlambat',
    coordinates: { lat: -6.21, lng: 106.82, address: 'SCBD Jakarta' },
    authHash: 'HASH002',
  },
  {
    id: 'm5-att-3',
    userId: 'usr_3',
    userNik: 'EMP-103',
    userName: 'Dian Sastro',
    department: 'Operations',
    date: '2026-11-22',
    time: '08:00:00',
    type: 'MASUK',
    status: 'Cuti',
    coordinates: { address: 'Cuti Tahunan' },
    authHash: 'HASH003',
  },
  {
    id: 'm5-att-4',
    userId: 'usr_1',
    userNik: 'EMP-101',
    userName: 'Budi Pratama',
    department: 'Engineering',
    date: '2026-11-23',
    time: '17:10:00',
    type: 'PULANG',
    status: 'Pulang',
    coordinates: { address: 'Jakarta Pusat' },
    authHash: 'HASH004',
  },
  {
    id: 'm5-att-5',
    userId: 'usr_2',
    userNik: 'EMP-102',
    userName: 'Citra Kirana',
    department: 'Finance',
    date: '2026-11-24',
    time: '08:00:00',
    type: 'MASUK',
    status: 'Sakit',
    coordinates: { address: 'Izin Sakit' },
    authHash: 'HASH005',
  },
];

const sampleLeaves = [
  {
    id: 'm5-lve-1',
    userId: 'usr_3',
    userNik: 'EMP-103',
    userName: 'Dian Sastro',
    department: 'Operations',
    type: 'cuti',
    typeLabel: 'Cuti Tahunan',
    startDate: '2026-11-22',
    endDate: '2026-11-22',
    durationDays: 1,
    reason: 'Acara keluarga',
    status: 'approved',
    reviewNotes: 'Disetujui HR',
  },
  {
    id: 'm5-lve-2',
    userId: 'usr_1',
    userNik: 'EMP-101',
    userName: 'Budi Pratama',
    department: 'Engineering',
    type: 'izin',
    typeLabel: 'Izin Pribadi',
    startDate: '2026-11-25',
    endDate: '2026-11-25',
    durationDays: 1,
    reason: 'Urusan dokumen',
    status: 'approved',
    reviewNotes: 'OK',
  },
];

describe('Milestone 5: Data Recapitulation & Excel Export (.xlsx)', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
    vi.clearAllMocks();
    setUsers(sampleUsers);
    setAttendances(sampleAttendances);
    setLeaves(sampleLeaves);
  });

  describe('1. AttendanceRekap Rendering & Summary KPIs', () => {
    it('renders recapitulation table with semantic headers, rows, and aggregated leave summary', () => {
      renderWithProviders(<AttendanceRekap />);

      const table = screen.getByTestId('recap-table');
      expect(table).toBeInTheDocument();

      // Check rows rendered
      expect(screen.getByTestId('recap-row-m5-att-1')).toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-2')).toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-3')).toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-4')).toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-5')).toBeInTheDocument();

      // Leave section aggregated
      expect(screen.getByTestId('recap-leaves-section')).toBeInTheDocument();
      expect(screen.getByTestId('leave-recap-item-m5-lve-1')).toBeInTheDocument();
      expect(screen.getByTestId('leave-recap-item-m5-lve-2')).toBeInTheDocument();
    });

    it('calculates KPI metric cards accurately without double counting overlapping leaves', () => {
      renderWithProviders(<AttendanceRekap />);

      // Hadir: m5-att-1 (Tepat Waktu) + m5-att-4 (Pulang) = 2
      expect(screen.getByTestId('rekap-kpi-hadir')).toHaveTextContent('2');
      // Terlambat: m5-att-2 = 1
      expect(screen.getByTestId('rekap-kpi-terlambat')).toHaveTextContent('1');
      // Cuti: m5-att-3 (EMP-103 on 2026-11-22) deduplicated with m5-lve-1 = 1
      expect(screen.getByTestId('rekap-kpi-cuti')).toHaveTextContent('1');
      // Izin/Sakit: m5-att-5 (Sakit) + m5-lve-2 (approved Izin on 2026-11-25) = 2
      expect(screen.getByTestId('rekap-kpi-izin-sakit')).toHaveTextContent('2');
    });
  });

  describe('2. Multi-Criteria Filtering & Empty States', () => {
    it('filters by NIK and employee name using search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AttendanceRekap />);

      const searchInput = screen.getByTestId('filter-search');
      await user.type(searchInput, 'EMP-102');

      expect(screen.queryByTestId('recap-row-m5-att-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-2')).toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-5')).toBeInTheDocument();

      await user.clear(searchInput);
      await user.type(searchInput, 'Dian');

      expect(screen.getByTestId('recap-row-m5-att-3')).toBeInTheDocument();
      expect(screen.queryByTestId('recap-row-m5-att-2')).not.toBeInTheDocument();
    });

    it('filters by department dynamically populated from users and records', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AttendanceRekap />);

      const deptSelect = screen.getByTestId('filter-department');
      // HR comes from sampleUsers even though no HR attendance record exists
      expect(within(deptSelect).getByRole('option', { name: 'HR' })).toBeInTheDocument();

      await user.selectOptions(deptSelect, 'Engineering');

      expect(screen.getByTestId('recap-row-m5-att-1')).toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-4')).toBeInTheDocument();
      expect(screen.queryByTestId('recap-row-m5-att-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('rekap-kpi-hadir')).toHaveTextContent('2');
    });

    it('filters by status including Pulang and date range', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AttendanceRekap />);

      const statusSelect = screen.getByTestId('filter-status');
      await user.selectOptions(statusSelect, 'Pulang');

      expect(screen.getByTestId('recap-row-m5-att-4')).toBeInTheDocument();
      expect(screen.queryByTestId('recap-row-m5-att-1')).not.toBeInTheDocument();

      // Reset to ALL and filter by date range
      await user.selectOptions(statusSelect, 'ALL');
      fireEvent.change(screen.getByTestId('filter-start-date'), { target: { value: '2026-11-21' } });
      fireEvent.change(screen.getByTestId('filter-end-date'), { target: { value: '2026-11-23' } });

      expect(screen.queryByTestId('recap-row-m5-att-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-2')).toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-3')).toBeInTheDocument();
      expect(screen.getByTestId('recap-row-m5-att-4')).toBeInTheDocument();
      expect(screen.queryByTestId('recap-row-m5-att-5')).not.toBeInTheDocument();
    });

    it('renders empty state when filter yields 0 matches and restores on reset', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AttendanceRekap />);

      await user.type(screen.getByTestId('filter-search'), 'TIDAK-ADA-999');

      expect(screen.getByTestId('empty-recap-state')).toBeInTheDocument();
      expect(
        screen.getByText('Tidak ditemukan data yang sesuai dengan kriteria filter')
      ).toBeInTheDocument();

      await user.click(screen.getByTestId('btn-reset-filters'));
      expect(screen.getByTestId('recap-row-m5-att-1')).toBeInTheDocument();
    });

    it('renders empty storage state when no attendance records exist', () => {
      setAttendances([]);
      setLeaves([]);
      renderWithProviders(<AttendanceRekap />);

      expect(screen.getByTestId('empty-recap-state')).toBeInTheDocument();
      expect(screen.getByText('Belum ada data presensi yang tercatat')).toBeInTheDocument();
    });
  });

  describe('3. SheetJS Excel Export Engine & Button Trigger', () => {
    it('generates valid .xlsx workbook with Data Absensi and Ringkasan KPI sheets and auto-fitted columns', async () => {
      const blob = exportAttendanceToExcel(sampleAttendances, sampleLeaves, 'PT Nusantara Maju');
      expect(blob).toBeDefined();

      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // PK zip magic signature
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
      expect(bytes[2]).toBe(0x03);
      expect(bytes[3]).toBe(0x04);

      const wb = XLSX.read(buffer, { type: 'buffer', cellStyles: true });
      expect(wb.SheetNames[0]).toBe('Data Absensi');
      expect(wb.SheetNames[1]).toBe('Ringkasan KPI');
      expect(wb.SheetNames).toContain('Rekap Presensi');
      expect(wb.SheetNames).toContain('Rekap Perizinan');

      // Validate Sheet 1 ("Data Absensi") columns and rows
      const dataSheet = wb.Sheets['Data Absensi'];
      expect(Array.isArray(dataSheet['!cols'])).toBe(true);
      expect(dataSheet['!cols'].length).toBe(11);
      expect(dataSheet['!cols'][3].wch).toBeGreaterThanOrEqual('Nama Karyawan'.length);

      const headerRow = XLSX.utils.sheet_to_json(dataSheet, { header: 1 })[0];
      expect(headerRow).toEqual([
        'No',
        'Tanggal',
        'NIK',
        'Nama Karyawan',
        'Departemen',
        'Waktu Masuk',
        'Waktu Pulang',
        'Status',
        'Tipe',
        'Lokasi/Geofence',
        'Catatan',
      ]);

      const dataRows = XLSX.utils.sheet_to_json(dataSheet);
      expect(dataRows).toHaveLength(5);
      expect(dataRows[0]['Nama Karyawan']).toBe('Budi Pratama');
      expect(dataRows[0]['Waktu Masuk']).toBe('07:45:00');
      expect(dataRows[3]['Waktu Pulang']).toBe('17:10:00');

      // Validate Sheet 2 ("Ringkasan KPI")
      const kpiSheet = wb.Sheets['Ringkasan KPI'];
      const kpiRows = XLSX.utils.sheet_to_json(kpiSheet);
      const kpiMap = Object.fromEntries(kpiRows.map((r) => [r.Metrik, r.Jumlah]));
      expect(kpiMap['Total Catatan']).toBe(7);
      expect(kpiMap['Hadir Tepat Waktu']).toBe(1);
      expect(kpiMap['Terlambat']).toBe(1);
      expect(kpiMap['Cuti']).toBe(2);
      expect(kpiMap['Izin']).toBe(1);
      expect(kpiMap['Sakit']).toBe(1);
    });

    it('triggers download with expected filename format from export-excel-btn', async () => {
      const user = userEvent.setup();
      const origCreateElement = document.createElement.bind(document);
      let capturedLink = null;
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = origCreateElement(tag);
        if (tag === 'a') {
          capturedLink = el;
          vi.spyOn(el, 'click').mockImplementation(() => {});
        }
        return el;
      });

      renderWithProviders(<AttendanceRekap />);

      const exportTrigger = screen.getByTestId('export-excel-btn');
      await user.click(exportTrigger);

      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(capturedLink).not.toBeNull();
      expect(capturedLink.download).toMatch(/_Rekap_Absensi_\d{4}-\d{2}-\d{2}\.xlsx$/);

      createElementSpy.mockRestore();
    });

    it('sanitizes invalid Excel sheet name characters and clamps to 31 chars', () => {
      const cleaned = sanitizeSheetName('Corp / [2026]: *Test? Name \\ VeryLongSheetTitle');
      expect(cleaned.length).toBeLessThanOrEqual(31);
      expect(cleaned).not.toMatch(/[\\/?*:[\]]/);
    });
  });

  describe('4. App Shell Admin Integration', () => {
    it('wires AttendanceRekap into Admin HR view when switching to Rekapitulasi tab', async () => {
      const user = userEvent.setup();
      setCurrentUser(sampleUsers[0]); // Admin HR

      renderWithProviders(<App />);

      // Initially on AdminDashboard
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();

      // Switch to Rekapitulasi via sidebar link
      await user.click(screen.getByTestId('sidebar-link-rekap'));
      expect(screen.getByTestId('attendance-rekap')).toBeInTheDocument();
      expect(screen.getByTestId('recap-table')).toBeInTheDocument();

      // Switch to Approval Hub and back to Rekapitulasi via BottomNav tab
      await user.click(screen.getByTestId('tab-approval'));
      expect(screen.getByTestId('leave-approval-hub')).toBeInTheDocument();

      await user.click(screen.getByTestId('tab-rekap'));
      expect(screen.getByTestId('attendance-rekap')).toBeInTheDocument();
    });
  });
});
