/**
 * Milestone 4 Comprehensive Unit & Integration Test Suite
 * Role Workflows: Karyawan & Admin HR Approval Hub
 * Covers 6 Modules and 39 Tests
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AttendanceHistory } from '@/components/attendance/AttendanceHistory.jsx';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm.jsx';
import { LeaveStatusList } from '@/components/leave/LeaveStatusList.jsx';
import { AdminDashboard } from '@/components/admin/AdminDashboard.jsx';
import { LeaveApprovalHub } from '@/components/admin/LeaveApprovalHub.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import {
  initStorage,
  getUsers,
  setUsers,
  getUserById,
  getAttendances,
  setAttendances,
  saveAttendance,
  getLeaves,
  setLeaves,
  addLeave,
  getLeaveRequests,
  saveLeaveRequest,
  updateLeaveRequestStatus,
  updateUserLeaveQuota,
  getCurrentUser,
  setCurrentUser,
} from '@/utils/storage.js';

const mockEmployee = {
  id: 'usr_emp001',
  nik: 'EMP-001',
  name: 'Ahmad Fauzi',
  email: 'ahmad.fauzi@perusahaan.co.id',
  role: 'karyawan',
  tenantId: 'corporate',
  department: 'Teknologi Informasi',
  position: 'Senior Frontend Developer',
  annualLeaveQuota: 12,
  annualLeaveRemaining: 12,
};

const mockAdmin = {
  id: 'usr_adm001',
  nik: 'ADM-001',
  name: 'Siti Rahma',
  email: 'siti.rahma@perusahaan.co.id',
  role: 'admin',
  tenantId: 'corporate',
  department: 'Human Resources',
  position: 'HR Operations Manager',
  annualLeaveQuota: 12,
  annualLeaveRemaining: 10,
};

function renderWithProviders(ui) {
  return render(
    <TenantProvider>
      <AuthProvider>{ui}</AuthProvider>
    </TenantProvider>
  );
}

describe('Milestone 4: Role Workflows (Karyawan & Admin HR Approval Hub)', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
    vi.clearAllMocks();
  });

  // =========================================================================
  // Module 1: AttendanceHistory Component
  // =========================================================================
  describe('Module 1: AttendanceHistory Component', () => {
    it('M4-HIST-01: Renders empty state message when no attendance records exist', () => {
      setAttendances([]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<AttendanceHistory />);

      expect(screen.getByTestId('attendance-history')).toBeInTheDocument();
      expect(screen.getByText('Belum ada riwayat kehadiran tercatat.')).toBeInTheDocument();
      expect(screen.getByText('Total: 0 Presensi')).toBeInTheDocument();
    });

    it('M4-HIST-02: Renders list of attendance cards matching user records with date, time, and badge', () => {
      setAttendances([
        {
          id: 'att-m4-1',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-20',
          time: '07:45:00',
          type: 'MASUK',
          status: 'Tepat Waktu',
          photoDataUrl: 'data:image/jpeg;base64,sample1',
          coordinates: { lat: -6.2088, lng: 106.8456, address: 'Kantor Pusat' },
          authHash: 'abc12345',
        },
        {
          id: 'att-m4-2',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-21',
          time: '08:15:00',
          type: 'MASUK',
          status: 'Terlambat',
          photoDataUrl: 'data:image/jpeg;base64,sample2',
          coordinates: { lat: -6.2088, lng: 106.8456, address: 'Kantor Pusat' },
          authHash: 'def67890',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<AttendanceHistory />);

      const card1 = screen.getByTestId('history-card-att-m4-1');
      const card2 = screen.getByTestId('history-card-att-m4-2');
      expect(card1).toBeInTheDocument();
      expect(card2).toBeInTheDocument();
      expect(screen.getByText('Total: 2 Presensi')).toBeInTheDocument();

      expect(within(card1).getByText('2026-11-20')).toBeInTheDocument();
      expect(within(card1).getByText('07:45:00')).toBeInTheDocument();
      expect(within(card1).getByText('Tepat Waktu')).toBeInTheDocument();

      expect(within(card2).getByText('2026-11-21')).toBeInTheDocument();
      expect(within(card2).getByText('08:15:00')).toBeInTheDocument();
      expect(within(card2).getByText('Terlambat')).toBeInTheDocument();
    });

    it('M4-HIST-03: Displays fallback avatar placeholder on image load error', () => {
      setAttendances([
        {
          id: 'att-broken',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-22',
          time: '07:50:00',
          type: 'MASUK',
          status: 'Tepat Waktu',
          photoDataUrl: 'data:image/jpeg;base64,corrupted',
          coordinates: { lat: -6.2088, lng: 106.8456, address: 'Kantor' },
          authHash: 'err111',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<AttendanceHistory />);

      const img = screen.getByAltText(`Foto Presensi ${mockEmployee.name}`);
      fireEvent.error(img);

      expect(screen.getByTestId('photo-placeholder-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('photo-placeholder-avatar')).toHaveTextContent('👤');
    });

    it('M4-HIST-04: Opens photo zoom modal on thumbnail click displaying detailed metadata', async () => {
      const user = userEvent.setup();
      setAttendances([
        {
          id: 'att-modal-test',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-20',
          time: '07:45:00',
          type: 'MASUK',
          status: 'Tepat Waktu',
          photoDataUrl: 'data:image/jpeg;base64,sampleZoom',
          coordinates: { lat: -6.2088, lng: 106.8456, address: 'Kantor Pusat' },
          authHash: 'zoomHash777',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<AttendanceHistory />);

      const thumbnail = screen.getByTestId('thumbnail-photo');
      await user.click(thumbnail);

      const modal = screen.getByTestId('photo-zoom-modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByText('Detail Bukti Presensi')).toBeInTheDocument();
      expect(screen.getByText(mockEmployee.name)).toBeInTheDocument();
      expect(screen.getByText(mockEmployee.nik)).toBeInTheDocument();
      expect(screen.getByText('2026-11-20 07:45:00 WIB')).toBeInTheDocument();
      expect(screen.getByText('#zoomHash777')).toBeInTheDocument();
    });

    it('M4-HIST-05: Closes photo zoom modal when close button is clicked or ESC is pressed', async () => {
      const user = userEvent.setup();
      setAttendances([
        {
          id: 'att-close-test',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-20',
          time: '07:45:00',
          type: 'MASUK',
          status: 'Tepat Waktu',
          photoDataUrl: 'data:image/jpeg;base64,sampleClose',
          coordinates: { lat: -6.2088, lng: 106.8456, address: 'Kantor' },
          authHash: 'closeHash',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<AttendanceHistory />);

      await user.click(screen.getByTestId('thumbnail-photo'));
      expect(screen.getByTestId('photo-zoom-modal')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Tutup Modal');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('photo-zoom-modal')).not.toBeInTheDocument();
      });
    });

    it('M4-HIST-06: Filters records by Tepat Waktu when ontime filter pill is clicked', async () => {
      const user = userEvent.setup();
      setAttendances([
        {
          id: 'att-filter-1',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-20',
          time: '07:45:00',
          type: 'MASUK',
          status: 'Tepat Waktu',
          photoDataUrl: '',
        },
        {
          id: 'att-filter-2',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-21',
          time: '08:20:00',
          type: 'MASUK',
          status: 'Terlambat',
          photoDataUrl: '',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<AttendanceHistory />);

      expect(screen.getByTestId('history-card-att-filter-1')).toBeInTheDocument();
      expect(screen.getByTestId('history-card-att-filter-2')).toBeInTheDocument();

      await user.click(screen.getByTestId('filter-status-ontime'));

      expect(screen.getByTestId('history-card-att-filter-1')).toBeInTheDocument();
      expect(screen.queryByTestId('history-card-att-filter-2')).not.toBeInTheDocument();
      expect(screen.getByText('Total: 1 Presensi')).toBeInTheDocument();
    });

    it('M4-HIST-07: Filters records by Terlambat and Pulang, and resets to Semua', async () => {
      const user = userEvent.setup();
      setAttendances([
        {
          id: 'att-on-1',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-20',
          time: '07:45:00',
          type: 'MASUK',
          status: 'Tepat Waktu',
        },
        {
          id: 'att-late-1',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-21',
          time: '08:20:00',
          type: 'MASUK',
          status: 'Terlambat',
        },
        {
          id: 'att-pulang-1',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          date: '2026-11-20',
          time: '17:05:00',
          type: 'PULANG',
          status: 'Pulang',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<AttendanceHistory />);

      // Filter Terlambat
      await user.click(screen.getByTestId('filter-status-late'));
      expect(screen.queryByTestId('history-card-att-on-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('history-card-att-late-1')).toBeInTheDocument();
      expect(screen.queryByTestId('history-card-att-pulang-1')).not.toBeInTheDocument();

      // Filter Pulang
      await user.click(screen.getByTestId('filter-status-pulang'));
      expect(screen.queryByTestId('history-card-att-on-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('history-card-att-late-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('history-card-att-pulang-1')).toBeInTheDocument();

      // Reset to Semua
      await user.click(screen.getByTestId('filter-status-all'));
      expect(screen.getByTestId('history-card-att-on-1')).toBeInTheDocument();
      expect(screen.getByTestId('history-card-att-late-1')).toBeInTheDocument();
      expect(screen.getByTestId('history-card-att-pulang-1')).toBeInTheDocument();
      expect(screen.getByText('Total: 3 Presensi')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Module 2: LeaveRequestForm Component
  // =========================================================================
  describe('Module 2: LeaveRequestForm Component', () => {
    it('M4-FORM-01: Renders leave request form with initial quota badge and default cuti type', () => {
      setUsers([mockEmployee]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveRequestForm />);

      expect(screen.getByTestId('leave-request-form')).toBeInTheDocument();
      expect(screen.getByTestId('leave-quota-badge')).toHaveTextContent('Sisa Cuti: 12 Hari');
      expect(screen.getByTestId('leave-type-select')).toHaveValue('cuti');
      expect(screen.getByTestId('calculated-duration')).toHaveTextContent('0 Hari');
      expect(screen.getByTestId('btn-submit-leave')).toBeInTheDocument();
    });

    it('M4-FORM-02: Calculates work days duration excluding weekends for valid date range', async () => {
      const user = userEvent.setup();
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveRequestForm />);

      // Mon Nov 23 2026 to Fri Nov 27 2026 = 5 working days
      await user.type(screen.getByTestId('leave-start-date'), '2026-11-23');
      await user.type(screen.getByTestId('leave-end-date'), '2026-11-27');

      expect(screen.getByTestId('calculated-duration')).toHaveTextContent('5 Hari');
    });

    it('M4-FORM-03: Disables submit button and shows error when end date is earlier than start date', async () => {
      const user = userEvent.setup();
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveRequestForm />);

      await user.type(screen.getByTestId('leave-start-date'), '2026-11-25');
      await user.type(screen.getByTestId('leave-end-date'), '2026-11-20');

      expect(screen.getByText('Tanggal selesai tidak boleh lebih awal dari tanggal mulai')).toBeInTheDocument();
      expect(screen.getByTestId('calculated-duration')).toHaveTextContent('0 Hari');
      expect(screen.getByTestId('btn-submit-leave')).toBeDisabled();
    });

    it('M4-FORM-04: Disables submit button and shows warning when selected date range consists only of weekend days', async () => {
      const user = userEvent.setup();
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveRequestForm />);

      // Sat Dec 5 2026 to Sun Dec 6 2026
      await user.type(screen.getByTestId('leave-start-date'), '2026-12-05');
      await user.type(screen.getByTestId('leave-end-date'), '2026-12-06');

      expect(screen.getByText('Rentang tanggal hanya memuat hari libur akhir pekan')).toBeInTheDocument();
      expect(screen.getByTestId('calculated-duration')).toHaveTextContent('0 Hari');
      expect(screen.getByTestId('btn-submit-leave')).toBeDisabled();
    });

    it('M4-FORM-05: Disables submit button and displays error when requested cuti duration exceeds remaining quota', async () => {
      const user = userEvent.setup();
      const lowQuotaEmployee = { ...mockEmployee, annualLeaveRemaining: 3 };
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(lowQuotaEmployee));
      setUsers([lowQuotaEmployee]);

      renderWithProviders(<LeaveRequestForm />);

      expect(screen.getByTestId('leave-quota-badge')).toHaveTextContent('Sisa Cuti: 3 Hari');

      // Mon Dec 7 2026 to Fri Dec 11 2026 = 5 working days (exceeds 3)
      await user.type(screen.getByTestId('leave-start-date'), '2026-12-07');
      await user.type(screen.getByTestId('leave-end-date'), '2026-12-11');

      expect(screen.getByText(/Sisa cuti tidak mencukupi \(Tersisa: 3 hari, Diajukan: 5 hari\)/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-submit-leave')).toBeDisabled();
    });

    it('M4-FORM-06: Allows request when leave type is non-cuti (izin/sakit) even if duration exceeds annual leave quota', async () => {
      const user = userEvent.setup();
      const lowQuotaEmployee = { ...mockEmployee, annualLeaveRemaining: 2 };
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(lowQuotaEmployee));
      setUsers([lowQuotaEmployee]);

      renderWithProviders(<LeaveRequestForm />);

      // Select izin
      await user.selectOptions(screen.getByTestId('leave-type-select'), 'izin');
      await user.type(screen.getByTestId('leave-start-date'), '2026-12-07');
      await user.type(screen.getByTestId('leave-end-date'), '2026-12-11');
      await user.type(screen.getByTestId('leave-reason-input'), 'Keperluan keluarga mendesak');

      // Non-cuti does not block on annual quota
      expect(screen.queryByText(/Sisa cuti tidak mencukupi/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('btn-submit-leave')).not.toBeDisabled();
    });

    it('M4-FORM-07: Displays error when reason is empty, whitespace-only, or fewer than 5 characters on submit', async () => {
      const user = userEvent.setup();
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveRequestForm />);

      await user.type(screen.getByTestId('leave-start-date'), '2026-11-23');
      await user.type(screen.getByTestId('leave-end-date'), '2026-11-24');

      // Whitespace only
      await user.type(screen.getByTestId('leave-reason-input'), '   ');
      await user.click(screen.getByTestId('btn-submit-leave'));

      expect(screen.getByTestId('leave-form-error')).toHaveTextContent('Alasan cuti wajib diisi minimal 5 karakter');
    });

    it('M4-FORM-08: Prevents submission and displays overlap error when date range conflicts with existing active/pending leave', async () => {
      const user = userEvent.setup();
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));
      setLeaves([
        {
          id: 'lve-exist-1',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          startDate: '2026-11-24',
          endDate: '2026-11-26',
          status: 'pending',
          type: 'cuti',
          durationDays: 3,
          reason: 'Cuti awal',
        },
      ]);

      renderWithProviders(<LeaveRequestForm />);

      // Overlaps Nov 24-26
      await user.type(screen.getByTestId('leave-start-date'), '2026-11-25');
      await user.type(screen.getByTestId('leave-end-date'), '2026-11-27');
      await user.type(screen.getByTestId('leave-reason-input'), 'Cuti bentrok tanggal');
      await user.click(screen.getByTestId('btn-submit-leave'));

      expect(screen.getByTestId('leave-form-error')).toHaveTextContent(
        'Anda sudah memiliki pengajuan cuti pada rentang tanggal tersebut'
      );
    });

    it('M4-FORM-09: Supports optional file attachment upload and displays preview pill with remove button', async () => {
      const user = userEvent.setup();
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveRequestForm />);

      const fileInput = screen.getByTestId('leave-attachment-input');
      const mockFile = new File(['surat dokter'], 'surat_keterangan_sakit.pdf', {
        type: 'application/pdf',
      });

      await user.upload(fileInput, mockFile);

      const preview = screen.getByTestId('leave-attachment-preview');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveTextContent('surat_keterangan_sakit.pdf');

      // Remove attachment
      const removeBtn = screen.getByTitle('Hapus lampiran');
      await user.click(removeBtn);

      expect(screen.queryByTestId('leave-attachment-preview')).not.toBeInTheDocument();
    });

    it('M4-FORM-10: Successfully submits valid leave request, displays success alert, resets form, and triggers onSubmitted callback', async () => {
      const user = userEvent.setup();
      const onSubmittedMock = vi.fn();
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));
      setLeaves([]);

      renderWithProviders(<LeaveRequestForm onSubmitted={onSubmittedMock} />);

      await user.type(screen.getByTestId('leave-start-date'), '2026-12-01');
      await user.type(screen.getByTestId('leave-end-date'), '2026-12-02');
      await user.type(screen.getByTestId('leave-reason-input'), 'Liburan akhir tahun bersama keluarga');

      // Optional attachment
      const fileInput = screen.getByTestId('leave-attachment-input');
      const mockFile = new File(['dokumen'], 'tiket_liburan.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, mockFile);

      await user.click(screen.getByTestId('btn-submit-leave'));

      expect(screen.getByTestId('leave-form-success')).toHaveTextContent(
        'Pengajuan cuti berhasil dikirim dan menunggu persetujuan HR'
      );
      expect(onSubmittedMock).toHaveBeenCalledTimes(1);
      expect(onSubmittedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cuti',
          startDate: '2026-12-01',
          endDate: '2026-12-02',
          durationDays: 2,
          reason: 'Liburan akhir tahun bersama keluarga',
          attachmentName: 'tiket_liburan.pdf',
          status: 'pending',
        })
      );

      // Verify persisted in storage
      const leavesInStore = getLeaves();
      expect(leavesInStore.length).toBe(1);
      expect(leavesInStore[0].reason).toBe('Liburan akhir tahun bersama keluarga');
      expect(leavesInStore[0].attachmentName).toBe('tiket_liburan.pdf');
    });
  });

  // =========================================================================
  // Module 3: LeaveStatusList Component
  // =========================================================================
  describe('Module 3: LeaveStatusList Component', () => {
    it('M4-STAT-01: Renders empty state when user has no submitted leave requests', () => {
      setLeaves([]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveStatusList />);

      expect(screen.getByTestId('leave-status-list')).toBeInTheDocument();
      expect(screen.getByText('Belum ada pengajuan cuti atau izin.')).toBeInTheDocument();
      expect(screen.getByText('0 Riwayat')).toBeInTheDocument();
    });

    it('M4-STAT-02: Renders list of user leaves with correct status badges', () => {
      setLeaves([
        {
          id: 'lve-stat-1',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          type: 'cuti',
          typeLabel: 'Cuti Tahunan',
          startDate: '2026-11-20',
          endDate: '2026-11-21',
          durationDays: 2,
          reason: 'Keperluan pribadi',
          status: 'pending',
        },
        {
          id: 'lve-stat-2',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          type: 'izin',
          typeLabel: 'Izin Urusan Pribadi',
          startDate: '2026-11-10',
          endDate: '2026-11-10',
          durationDays: 1,
          reason: 'Urusan SIM',
          status: 'approved',
        },
        {
          id: 'lve-stat-3',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          type: 'sakit',
          typeLabel: 'Sakit',
          startDate: '2026-11-05',
          endDate: '2026-11-05',
          durationDays: 1,
          reason: 'Demam',
          status: 'rejected',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveStatusList />);

      expect(screen.getByTestId('leave-card-lve-stat-1')).toBeInTheDocument();
      expect(screen.getByTestId('leave-card-lve-stat-2')).toBeInTheDocument();
      expect(screen.getByTestId('leave-card-lve-stat-3')).toBeInTheDocument();

      expect(screen.getByText('Menunggu Persetujuan')).toBeInTheDocument();
      expect(screen.getByText('Disetujui')).toBeInTheDocument();
      expect(screen.getByText('Ditolak')).toBeInTheDocument();
    });

    it('M4-STAT-03: Displays HR review notes and reviewer name when present', () => {
      setLeaves([
        {
          id: 'lve-reviewed',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          type: 'cuti',
          typeLabel: 'Cuti Tahunan',
          startDate: '2026-11-20',
          endDate: '2026-11-21',
          durationDays: 2,
          reason: 'Liburan',
          status: 'approved',
          reviewedBy: 'Siti Rahma',
          reviewNotes: 'Disetujui, selamat berlibur.',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveStatusList />);

      const notes = screen.getByTestId('hr-review-notes');
      expect(notes).toBeInTheDocument();
      expect(notes).toHaveTextContent('Catatan HR (Siti Rahma): Disetujui, selamat berlibur.');
    });

    it('M4-STAT-04: Displays attachment badge with file name when request has attachment', () => {
      setLeaves([
        {
          id: 'lve-with-attachment',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          type: 'sakit',
          typeLabel: 'Sakit',
          startDate: '2026-11-15',
          endDate: '2026-11-16',
          durationDays: 2,
          reason: 'Rawat inap flu',
          attachmentName: 'surat_dokter_rs_pondok_indah.pdf',
          status: 'pending',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));

      renderWithProviders(<LeaveStatusList />);

      const badge = screen.getByTestId('attachment-badge-lve-with-attachment');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('surat_dokter_rs_pondok_indah.pdf');
    });

    it('M4-STAT-05: Re-fetches and updates leave list when refreshKey changes', () => {
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockEmployee));
      setLeaves([]);

      const { rerender } = renderWithProviders(<LeaveStatusList refreshKey={0} />);
      expect(screen.getByText('0 Riwayat')).toBeInTheDocument();

      // Add record to storage
      addLeave({
        userId: mockEmployee.id,
        userNik: mockEmployee.nik,
        type: 'cuti',
        typeLabel: 'Cuti Tahunan',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        durationDays: 2,
        reason: 'Cuti dinamis',
      });

      rerender(
        <TenantProvider>
          <AuthProvider>
            <LeaveStatusList refreshKey={1} />
          </AuthProvider>
        </TenantProvider>
      );

      expect(screen.getByText('1 Riwayat')).toBeInTheDocument();
      expect(screen.getByText('Cuti dinamis')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Module 4: AdminDashboard Component
  // =========================================================================
  describe('Module 4: AdminDashboard Component', () => {
    it('M4-DASH-01: Renders executive KPI metric cards for total employees, on time, late, and approved leaves', () => {
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<AdminDashboard />);

      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-total-employees')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-ontime')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-late')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-leave')).toBeInTheDocument();
      expect(screen.getByTestId('live-attendance-feed')).toBeInTheDocument();
    });

    it('M4-DASH-02: Accurately calculates KPIs based on current stored attendances, users, and leaves', () => {
      setUsers([
        { id: 'u1', role: 'karyawan', nik: 'EMP-01' },
        { id: 'u2', role: 'karyawan', nik: 'EMP-02' },
        { id: 'u3', role: 'karyawan', nik: 'EMP-03' },
        { id: 'u4', role: 'admin', nik: 'ADM-01' },
      ]);
      setAttendances([
        { id: 'a1', status: 'Tepat Waktu', userName: 'User 1', userNik: 'EMP-01', department: 'IT', time: '07:45' },
        { id: 'a2', status: 'Hadir', userName: 'User 2', userNik: 'EMP-02', department: 'HR', time: '07:55' },
        { id: 'a3', status: 'Terlambat', userName: 'User 3', userNik: 'EMP-03', department: 'Finance', time: '08:30' },
      ]);
      setLeaves([
        { id: 'l1', status: 'approved' },
        { id: 'l2', status: 'approved' },
        { id: 'l3', status: 'pending' },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<AdminDashboard />);

      // Total employees: 3 karyawan
      expect(screen.getByTestId('kpi-total-employees')).toHaveTextContent('3');
      // On time: 2 (1 Tepat Waktu + 1 Hadir)
      expect(screen.getByTestId('kpi-ontime')).toHaveTextContent('2');
      // Late: 1
      expect(screen.getByTestId('kpi-late')).toHaveTextContent('1');
      // Leave: 2 approved
      expect(screen.getByTestId('kpi-leave')).toHaveTextContent('2');
    });

    it('M4-DASH-03: Renders real-time live attendance feed items with employee names, NIK, and status', () => {
      setAttendances([
        {
          id: 'live-feed-1',
          userName: 'Budi Santoso',
          userNik: 'EMP-005',
          department: 'Operasional',
          status: 'Tepat Waktu',
          time: '07:50',
          photoDataUrl: 'data:image/jpeg;base64,mockBudi',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<AdminDashboard />);

      expect(screen.getByTestId('feed-item-live-feed-1')).toBeInTheDocument();
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
      expect(screen.getByText(/EMP-005 • Operasional/)).toBeInTheDocument();
      expect(screen.getByText('07:50 WIB')).toBeInTheDocument();
    });

    it('M4-DASH-04: Renders [SIMULATOR] warning badge for attendances marked as isSimulator: true', () => {
      setAttendances([
        {
          id: 'live-sim-feed',
          userName: 'Citra Dewi',
          userNik: 'EMP-009',
          department: 'Logistik',
          status: 'Tepat Waktu',
          time: '07:52',
          isSimulator: true,
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<AdminDashboard />);

      const badge = screen.getByTestId('simulator-warning-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('[SIMULATOR]');
    });

    it('M4-DASH-05: Displays zero counts gracefully when storage has no attendance or leave records', () => {
      setUsers([{ id: 'u1', role: 'admin', nik: 'ADM-01' }]);
      setAttendances([]);
      setLeaves([]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<AdminDashboard />);

      expect(screen.getByTestId('kpi-ontime')).toHaveTextContent('0');
      expect(screen.getByTestId('kpi-late')).toHaveTextContent('0');
      expect(screen.getByTestId('kpi-leave')).toHaveTextContent('0');
    });
  });

  // =========================================================================
  // Module 5: LeaveApprovalHub Component
  // =========================================================================
  describe('Module 5: LeaveApprovalHub Component', () => {
    it('M4-APPR-01: Renders queue of pending leave requests and displays pending count badge', () => {
      setLeaves([
        {
          id: 'lve-pending-1',
          userName: 'Ahmad Fauzi',
          userNik: 'EMP-001',
          type: 'cuti',
          typeLabel: 'Cuti Tahunan',
          startDate: '2026-11-25',
          endDate: '2026-11-26',
          durationDays: 2,
          reason: 'Acara keluarga besar',
          status: 'pending',
        },
        {
          id: 'lve-pending-2',
          userName: 'Budi Santoso',
          userNik: 'EMP-002',
          type: 'izin',
          typeLabel: 'Izin Urusan Pribadi',
          startDate: '2026-11-27',
          endDate: '2026-11-27',
          durationDays: 1,
          reason: 'Pembaruan paspor',
          status: 'pending',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<LeaveApprovalHub />);

      expect(screen.getByTestId('pending-count-badge')).toHaveTextContent('2 Menunggu');
      expect(screen.getByTestId('approval-item-lve-pending-1')).toBeInTheDocument();
      expect(screen.getByTestId('approval-item-lve-pending-2')).toBeInTheDocument();
    });

    it('M4-APPR-02: Displays empty state message when there are no pending leave requests', () => {
      setLeaves([
        {
          id: 'lve-approved-already',
          userName: 'Ahmad Fauzi',
          userNik: 'EMP-001',
          status: 'approved',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<LeaveApprovalHub />);

      expect(screen.getByTestId('pending-count-badge')).toHaveTextContent('0 Menunggu');
      expect(
        screen.getByText('Tidak ada pengajuan cuti yang memerlukan persetujuan saat ini.')
      ).toBeInTheDocument();
    });

    it('M4-APPR-03: Opens approval modal on Review or Setujui button click with applicant details and attachment preview', async () => {
      const user = userEvent.setup();
      setLeaves([
        {
          id: 'lve-review-test',
          userName: 'Ahmad Fauzi',
          userNik: 'EMP-001',
          type: 'sakit',
          typeLabel: 'Sakit',
          startDate: '2026-11-25',
          endDate: '2026-11-26',
          durationDays: 2,
          reason: 'Flu berat perlu istirahat',
          attachmentName: 'surat_sakit_fauzi.pdf',
          status: 'pending',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<LeaveApprovalHub />);

      await user.click(screen.getByTestId('btn-review-lve-review-test'));

      const modal = screen.getByTestId('approval-modal');
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(/Ahmad Fauzi \(EMP-001\)/)).toBeInTheDocument();
      expect(within(modal).getByText(/surat_sakit_fauzi\.pdf/)).toBeInTheDocument();
      expect(within(modal).getByTestId('hr-notes-input')).toBeInTheDocument();
      expect(within(modal).getByTestId('btn-confirm-approve')).toBeInTheDocument();
    });

    it('M4-APPR-04: Approves leave request, decrements employee leave quota, records reviewer info, and updates queue immediately', async () => {
      const user = userEvent.setup();
      setUsers([mockEmployee, mockAdmin]);
      setLeaves([
        {
          id: 'lve-to-approve',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          type: 'cuti',
          typeLabel: 'Cuti Tahunan',
          startDate: '2026-11-25',
          endDate: '2026-11-26',
          durationDays: 2,
          reason: 'Cuti keluarga',
          status: 'pending',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<LeaveApprovalHub />);

      await user.click(screen.getByTestId('btn-approve-lve-to-approve'));
      await user.type(screen.getByTestId('hr-notes-input'), 'Disetujui silakan beristirahat');
      await user.click(screen.getByTestId('btn-confirm-approve'));

      // Queue updates immediately
      expect(screen.getByTestId('pending-count-badge')).toHaveTextContent('0 Menunggu');
      expect(screen.queryByTestId('approval-item-lve-to-approve')).not.toBeInTheDocument();

      // Verify leave status in store
      const leavesInStore = getLeaves();
      const approvedLeave = leavesInStore.find((l) => l.id === 'lve-to-approve');
      expect(approvedLeave.status).toBe('approved');
      expect(approvedLeave.reviewedBy).toBe(mockAdmin.name);
      expect(approvedLeave.reviewNotes).toBe('Disetujui silakan beristirahat');

      // Verify employee quota decremented from 12 to 10
      const usersInStore = getUsers();
      const updatedEmp = usersInStore.find((u) => u.id === mockEmployee.id);
      expect(updatedEmp.annualLeaveRemaining).toBe(10);
    });

    it('M4-APPR-05: Rejects approval when notes are empty and enforces mandatory notes for rejection', async () => {
      const user = userEvent.setup();
      setLeaves([
        {
          id: 'lve-reject-guard',
          userName: 'Budi Santoso',
          userNik: 'EMP-002',
          type: 'cuti',
          startDate: '2026-11-25',
          endDate: '2026-11-26',
          durationDays: 2,
          reason: 'Cuti mendadak',
          status: 'pending',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<LeaveApprovalHub />);

      await user.click(screen.getByTestId('btn-reject-lve-reject-guard'));

      // Click reject without notes
      await user.click(screen.getByTestId('btn-confirm-reject'));

      expect(screen.getByTestId('approval-error-msg')).toHaveTextContent(
        'Harap cantumkan alasan/catatan penolakan'
      );

      // Leave should remain pending
      const leavesInStore = getLeaves();
      expect(leavesInStore[0].status).toBe('pending');
    });

    it('M4-APPR-06: Rejects leave request with explanation notes without deducting employee quota', async () => {
      const user = userEvent.setup();
      setUsers([mockEmployee, mockAdmin]);
      setLeaves([
        {
          id: 'lve-to-reject',
          userId: mockEmployee.id,
          userNik: mockEmployee.nik,
          userName: mockEmployee.name,
          type: 'cuti',
          startDate: '2026-11-25',
          endDate: '2026-11-26',
          durationDays: 2,
          reason: 'Cuti saat deadline rilis',
          status: 'pending',
        },
      ]);
      localStorage.setItem('absensi_v1_current_user', JSON.stringify(mockAdmin));

      renderWithProviders(<LeaveApprovalHub />);

      await user.click(screen.getByTestId('btn-reject-lve-to-reject'));
      await user.type(screen.getByTestId('hr-notes-input'), 'Ditolak karena sprint deadline');
      await user.click(screen.getByTestId('btn-confirm-reject'));

      // Queue updates
      expect(screen.getByTestId('pending-count-badge')).toHaveTextContent('0 Menunggu');

      // Verify leave status rejected in store
      const leavesInStore = getLeaves();
      const rejectedLeave = leavesInStore.find((l) => l.id === 'lve-to-reject');
      expect(rejectedLeave.status).toBe('rejected');
      expect(rejectedLeave.reviewNotes).toBe('Ditolak karena sprint deadline');

      // Verify employee quota NOT decremented (stays 12)
      const usersInStore = getUsers();
      const emp = usersInStore.find((u) => u.id === mockEmployee.id);
      expect(emp.annualLeaveRemaining).toBe(12);
    });
  });

  // =========================================================================
  // Module 6: Storage Helpers & Cross-Role State Synchronization
  // =========================================================================
  describe('Module 6: Storage Helpers & Cross-Role State Synchronization', () => {
    it('M4-SYNC-01: Verifies contract alias saveAttendance stores record and returns generated ID', () => {
      setAttendances([]);

      const record = saveAttendance({
        userId: 'usr_test',
        userName: 'Test User',
        userNik: 'TST-001',
        date: '2026-11-24',
        time: '08:00:00',
        type: 'MASUK',
        status: 'Tepat Waktu',
      });

      expect(record.id).toBeDefined();
      expect(record.createdAt).toBeDefined();
      const inStore = getAttendances();
      expect(inStore.length).toBe(1);
      expect(inStore[0].id).toBe(record.id);
    });

    it('M4-SYNC-02: Verifies contract aliases getLeaveRequests and saveLeaveRequest operate correctly', () => {
      setLeaves([]);

      const leave = saveLeaveRequest({
        userId: 'usr_test',
        userName: 'Test User',
        userNik: 'TST-001',
        type: 'cuti',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        durationDays: 2,
        reason: 'Urusan keluarga',
      });

      expect(leave.id).toBeDefined();
      expect(leave.status).toBe('pending');
      const allRequests = getLeaveRequests();
      expect(allRequests.length).toBe(1);
      expect(allRequests[0].id).toBe(leave.id);
    });

    it('M4-SYNC-03: Verifies updateLeaveRequestStatus updates leave status and reviewer details', () => {
      setLeaves([]);
      const created = saveLeaveRequest({
        userId: 'usr_test',
        userName: 'Test User',
        userNik: 'TST-001',
        type: 'izin',
        durationDays: 1,
        reason: 'Urusan izin',
      });

      const updated = updateLeaveRequestStatus(created.id, 'approved', {
        reviewedBy: 'Admin HR Test',
        reviewNotes: 'Catatan disetujui',
      });

      expect(updated.status).toBe('approved');
      expect(updated.reviewedBy).toBe('Admin HR Test');
      expect(updated.reviewNotes).toBe('Catatan disetujui');
    });

    it('M4-SYNC-04: Verifies updateUserLeaveQuota updates user annualLeaveRemaining in users store and current session', () => {
      setUsers([mockEmployee]);
      setCurrentUser(mockEmployee);

      const updated = updateUserLeaveQuota(mockEmployee.id, 7);

      expect(updated).not.toBeNull();
      expect(updated.annualLeaveRemaining).toBe(7);

      // Verify in store
      const inStore = getUserById(mockEmployee.id);
      expect(inStore.annualLeaveRemaining).toBe(7);

      // Verify session synced
      const sessionUser = getCurrentUser();
      expect(sessionUser.annualLeaveRemaining).toBe(7);
    });

    it('M4-SYNC-05: Full cross-role lifecycle: employee submits cuti -> HR approves -> quota decremented and session synced', () => {
      setUsers([mockEmployee, mockAdmin]);
      setCurrentUser(mockEmployee);
      setLeaves([]);

      // 1. Employee submits cuti for 3 days
      const leave = saveLeaveRequest({
        userId: mockEmployee.id,
        userNik: mockEmployee.nik,
        userName: mockEmployee.name,
        type: 'cuti',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        durationDays: 3,
        reason: 'Liburan 3 hari kerja',
      });

      expect(leave.status).toBe('pending');

      // 2. HR approves leave request
      const approved = updateLeaveRequestStatus(leave.id, 'approved', {
        reviewedBy: mockAdmin.name,
        reviewNotes: 'Disetujui oleh HR manager',
      });

      expect(approved.status).toBe('approved');

      // 3. User quota in users list decremented: 12 - 3 = 9
      const refreshedEmployee = getUserById(mockEmployee.id);
      expect(refreshedEmployee.annualLeaveRemaining).toBe(9);

      // 4. Active session user quota also synced: 9
      const sessionUser = getCurrentUser();
      expect(sessionUser.annualLeaveRemaining).toBe(9);
    });

    it('M4-SYNC-06: Full cross-role lifecycle: employee submits sakit -> HR approves -> quota is preserved unchanged', () => {
      setUsers([mockEmployee, mockAdmin]);
      setCurrentUser(mockEmployee);
      setLeaves([]);

      // 1. Employee submits sakit for 4 days
      const leave = saveLeaveRequest({
        userId: mockEmployee.id,
        userNik: mockEmployee.nik,
        userName: mockEmployee.name,
        type: 'sakit',
        startDate: '2026-12-01',
        endDate: '2026-12-04',
        durationDays: 4,
        reason: 'Sakit tifus rawat inap',
      });

      // 2. HR approves
      const approved = updateLeaveRequestStatus(leave.id, 'approved', {
        reviewedBy: mockAdmin.name,
        reviewNotes: 'Semoga lekas sembuh',
      });

      expect(approved.status).toBe('approved');

      // 3. Quota should NOT be deducted for non-cuti requests (stays 12)
      const refreshedEmployee = getUserById(mockEmployee.id);
      expect(refreshedEmployee.annualLeaveRemaining).toBe(12);

      const sessionUser = getCurrentUser();
      expect(sessionUser.annualLeaveRemaining).toBe(12);
    });
  });
});
