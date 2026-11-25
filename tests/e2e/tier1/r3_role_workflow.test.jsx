import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '@/App.jsx';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory.jsx';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm.jsx';
import { AdminDashboard } from '@/components/admin/AdminDashboard.jsx';
import { LeaveApprovalHub } from '@/components/admin/LeaveApprovalHub.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import {
  initStorage,
  getUsers,
  setUsers,
  getLeaves,
  setLeaves,
  setAttendances,
} from '@/utils/storage.js';

describe('Tier 1 - R3: Role Separation & Leave Approval Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T1-R3-01: Role Separation (Karyawan vs Admin HR Access Control)', () => {
    // Act 1: Authenticate as Karyawan
    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        department: 'Engineering',
      })
    );

    const { unmount } = render(<App />);

    // Expect Karyawan navigation links to exist
    expect(screen.getByTestId('tab-presensi')).toBeInTheDocument();
    expect(screen.getByTestId('tab-riwayat')).toBeInTheDocument();
    expect(screen.getByTestId('tab-pengajuan')).toBeInTheDocument();

    // Expect Admin links to NOT exist
    expect(screen.queryByTestId('tab-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tab-approval')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tab-rekap')).not.toBeInTheDocument();

    unmount();

    // Act 2: Authenticate as Admin HR
    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_adm001',
        nik: 'ADM-001',
        name: 'Siti Rahma',
        role: 'admin',
        department: 'HR',
      })
    );

    render(<App />);

    // Expect Admin links to exist
    expect(screen.getByTestId('tab-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('tab-approval')).toBeInTheDocument();
    expect(screen.getByTestId('tab-rekap')).toBeInTheDocument();
  });

  it('T1-R3-02: Karyawan Attendance History Display & Photo Zoom', async () => {
    const user = userEvent.setup();

    // Pre-seed 3 attendance records
    setAttendances([
      {
        id: 'att-1',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        date: '2026-11-20',
        time: '07:45:00',
        type: 'MASUK',
        status: 'Tepat Waktu',
        photoDataUrl: 'data:image/jpeg;base64,mock1',
        coordinates: { lat: -6.2088, lng: 106.8456, address: 'Jl. Sudirman' },
      },
      {
        id: 'att-2',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        date: '2026-11-21',
        time: '08:15:00',
        type: 'MASUK',
        status: 'Terlambat',
        photoDataUrl: 'data:image/jpeg;base64,mock2',
        coordinates: { lat: -6.2088, lng: 106.8456, address: 'Jl. Sudirman' },
      },
      {
        id: 'att-3',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        date: '2026-11-22',
        time: '07:55:00',
        type: 'MASUK',
        status: 'Tepat Waktu',
        photoDataUrl: 'data:image/jpeg;base64,mock3',
        coordinates: { lat: -6.2088, lng: 106.8456, address: 'Jl. Sudirman' },
      },
    ]);

    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
      })
    );

    render(
      <TenantProvider>
        <AuthProvider>
          <AttendanceHistory />
        </AuthProvider>
      </TenantProvider>
    );

    expect(screen.getByTestId('history-card-att-1')).toBeInTheDocument();
    expect(screen.getByTestId('history-card-att-2')).toBeInTheDocument();
    expect(screen.getByTestId('history-card-att-3')).toBeInTheDocument();

    // Click on thumbnail photo
    const thumbnails = screen.getAllByTestId('thumbnail-photo');
    await user.click(thumbnails[0]);

    // Expect photo zoom modal to open
    expect(screen.getByTestId('photo-zoom-modal')).toBeInTheDocument();
  });

  it('T1-R3-03: Karyawan Leave Submission (Cuti/Izin/Sakit)', async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveRemaining: 12,
      })
    );

    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveRequestForm />
        </AuthProvider>
      </TenantProvider>
    );

    // Select start date & end date (work days: Wednesday to Friday, e.g. 2026-12-02 to 2026-12-04)
    const startDateInput = screen.getByTestId('leave-start-date');
    const endDateInput = screen.getByTestId('leave-end-date');
    const reasonInput = screen.getByTestId('leave-reason-input');

    await user.type(startDateInput, '2026-12-02');
    await user.type(endDateInput, '2026-12-04');
    await user.type(reasonInput, 'Keperluan acara keluarga penting');

    const submitBtn = screen.getByTestId('btn-submit-leave');
    await user.click(submitBtn);

    // Expect success message
    await waitFor(() => {
      expect(screen.getByTestId('leave-form-success')).toBeInTheDocument();
    });

    // Expect leave record saved to storage
    const leaves = getLeaves();
    const submitted = leaves.find((l) => l.reason === 'Keperluan acara keluarga penting');
    expect(submitted).toBeDefined();
    expect(submitted.status).toBe('pending');
    expect(submitted.durationDays).toBe(3);
  });

  it('T1-R3-04: Admin HR Executive Dashboard KPIs', () => {
    // Seed 10 users: 1 Admin, 9 employees
    const users = [
      { id: 'u0', nik: 'ADM-001', name: 'Admin Siti', role: 'admin' },
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `u${i + 1}`,
        nik: `EMP-00${i + 1}`,
        name: `Karyawan ${i + 1}`,
        role: 'karyawan',
      })),
    ];
    setUsers(users);

    // Seed attendances: 6 on time, 2 late
    const attendances = [
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `att-ontime-${i}`,
        userId: `u${i + 1}`,
        userName: `Karyawan ${i + 1}`,
        userNik: `EMP-00${i + 1}`,
        date: '2026-11-24',
        time: '07:45:00',
        status: 'Tepat Waktu',
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: `att-late-${i}`,
        userId: `u${i + 7}`,
        userName: `Karyawan ${i + 7}`,
        userNik: `EMP-00${i + 7}`,
        date: '2026-11-24',
        time: '08:30:00',
        status: 'Terlambat',
      })),
    ];
    setAttendances(attendances);

    // Seed 2 approved leaves
    setLeaves([
      { id: 'l1', status: 'approved', type: 'cuti' },
      { id: 'l2', status: 'approved', type: 'izin' },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </TenantProvider>
    );

    expect(screen.getByTestId('kpi-total-employees')).toHaveTextContent('9');
    expect(screen.getByTestId('kpi-ontime')).toHaveTextContent('6');
    expect(screen.getByTestId('kpi-late')).toHaveTextContent('2');
    expect(screen.getByTestId('kpi-leave')).toHaveTextContent('2');
  });

  it('T1-R3-05: Admin HR Leave Approval & Quota Balance Deduction', async () => {
    const user = userEvent.setup();

    // User with 12 days remaining
    setUsers([
      {
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveQuota: 12,
        annualLeaveRemaining: 12,
      },
    ]);

    // Pending 3 days leave
    setLeaves([
      {
        id: 'lve-test-01',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        type: 'cuti',
        durationDays: 3,
        startDate: '2026-12-02',
        endDate: '2026-12-04',
        reason: 'Liburan bersama keluarga',
        status: 'pending',
      },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveApprovalHub />
        </AuthProvider>
      </TenantProvider>
    );

    // Click "Setujui" or "Review"
    const approveBtn = screen.getByTestId('btn-approve-lve-test-01');
    await user.click(approveBtn);

    // Review modal opens
    expect(screen.getByTestId('approval-modal')).toBeInTheDocument();

    // Enter notes
    const notesInput = screen.getByTestId('hr-notes-input');
    await user.type(notesInput, 'Disetujui, selamat berlibur');

    // Confirm approve
    const confirmBtn = screen.getByTestId('btn-confirm-approve');
    await user.click(confirmBtn);

    // Verify leave status updated to approved
    await waitFor(() => {
      const leaves = getLeaves();
      const updated = leaves.find((l) => l.id === 'lve-test-01');
      expect(updated.status).toBe('approved');
      expect(updated.reviewNotes).toBe('Disetujui, selamat berlibur');
    });

    // Verify employee annualLeaveRemaining deducted from 12 to 9
    const users = getUsers();
    const emp = users.find((u) => u.nik === 'EMP-001');
    expect(emp.annualLeaveRemaining).toBe(9);
  });

  it('T1-R3-06: Admin HR Leave Rejection (No Quota Deduction)', async () => {
    const user = userEvent.setup();

    setUsers([
      {
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveQuota: 12,
        annualLeaveRemaining: 9,
      },
    ]);

    setLeaves([
      {
        id: 'lve-test-02',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        type: 'cuti',
        durationDays: 2,
        startDate: '2026-12-10',
        endDate: '2026-12-11',
        reason: 'Acara mendadak',
        status: 'pending',
      },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveApprovalHub />
        </AuthProvider>
      </TenantProvider>
    );

    // Click "Tolak"
    const rejectBtn = screen.getByTestId('btn-reject-lve-test-02');
    await user.click(rejectBtn);

    // Enter rejection notes
    const notesInput = screen.getByTestId('hr-notes-input');
    await user.type(notesInput, 'Jadwal bentrok dengan audit ISO');

    // Confirm reject
    const confirmBtn = screen.getByTestId('btn-confirm-reject');
    await user.click(confirmBtn);

    // Verify status updated to rejected
    await waitFor(() => {
      const leaves = getLeaves();
      const updated = leaves.find((l) => l.id === 'lve-test-02');
      expect(updated.status).toBe('rejected');
    });

    // Verify quota remains at 9
    const users = getUsers();
    const emp = users.find((u) => u.nik === 'EMP-001');
    expect(emp.annualLeaveRemaining).toBe(9);
  });
});
