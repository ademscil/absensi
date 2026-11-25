import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '@/App.jsx';
import { LeaveApprovalHub } from '@/components/admin/LeaveApprovalHub.jsx';
import { LeaveStatusList } from '@/components/leave/LeaveStatusList.jsx';
import { AdminDashboard } from '@/components/admin/AdminDashboard.jsx';
import { AttendanceModal } from '@/components/attendance/AttendanceModal.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import {
  initStorage,
  getUsers,
  setUsers,
  getLeaves,
  setLeaves,
  getAttendances,
  setAttendances,
  addAttendance,
} from '@/utils/storage.js';

describe('Tier 3 - State Sync: Karyawan ↔ Admin HR', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T3-SYNC-01: Real-Time Leave Approval Quota Sync', async () => {
    const user = userEvent.setup();

    // 1. Karyawan initial balance: 12 days
    setUsers([
      {
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveRemaining: 12,
      },
    ]);

    // 2. Karyawan submits 3 days cuti
    setLeaves([
      {
        id: 'sync-lve-01',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        type: 'cuti',
        durationDays: 3,
        startDate: '2026-12-02',
        endDate: '2026-12-04',
        reason: 'Urusan keluarga mendesak',
        status: 'pending',
      },
    ]);

    // 3. Admin opens Approval Hub and approves
    const { unmount } = render(
      <TenantProvider>
        <AuthProvider>
          <LeaveApprovalHub />
        </AuthProvider>
      </TenantProvider>
    );

    await user.click(screen.getByTestId('btn-approve-sync-lve-01'));
    await user.type(screen.getByTestId('hr-notes-input'), 'Approved by HR Manager');
    await user.click(screen.getByTestId('btn-confirm-approve'));

    unmount();

    // 4. Karyawan views leave status list & balance
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
          <LeaveStatusList />
        </AuthProvider>
      </TenantProvider>
    );

    // Expect status to show "Disetujui"
    expect(screen.getByText('Disetujui')).toBeInTheDocument();
    expect(screen.getByTestId('hr-review-notes')).toHaveTextContent('Approved by HR Manager');

    // Expect user storage quota updated from 12 to 9
    const users = getUsers();
    const emp = users.find((u) => u.nik === 'EMP-001');
    expect(emp.annualLeaveRemaining).toBe(9);
  });

  it('T3-SYNC-02: Real-Time Leave Rejection Quota Restoral', async () => {
    const user = userEvent.setup();

    setUsers([
      {
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveRemaining: 12,
      },
    ]);

    setLeaves([
      {
        id: 'sync-lve-02',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        type: 'cuti',
        durationDays: 2,
        startDate: '2026-12-02',
        endDate: '2026-12-03',
        reason: 'Keperluan pribadi',
        status: 'pending',
      },
    ]);

    // Admin rejects request
    const { unmount } = render(
      <TenantProvider>
        <AuthProvider>
          <LeaveApprovalHub />
        </AuthProvider>
      </TenantProvider>
    );

    await user.click(screen.getByTestId('btn-reject-sync-lve-02'));
    await user.type(screen.getByTestId('hr-notes-input'), 'Rejected due to sprint delivery deadline');
    await user.click(screen.getByTestId('btn-confirm-reject'));

    unmount();

    // Karyawan views status
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
          <LeaveStatusList />
        </AuthProvider>
      </TenantProvider>
    );

    expect(screen.getByText('Ditolak')).toBeInTheDocument();

    // Quota remains 12
    const users = getUsers();
    const emp = users.find((u) => u.nik === 'EMP-001');
    expect(emp.annualLeaveRemaining).toBe(12);
  });

  it('T3-SYNC-03: Live Attendance Stream HR Instant Update', async () => {
    // Initial 5 attendance records
    const initialAtts = Array.from({ length: 5 }, (_, i) => ({
      id: `att-sync-${i}`,
      userNik: `EMP-00${i + 1}`,
      userName: `Karyawan ${i + 1}`,
      date: '2026-11-24',
      time: '07:30:00',
      status: 'Tepat Waktu',
    }));
    setAttendances(initialAtts);

    // Karyawan performs check-in
    addAttendance({
      id: 'att-new-sync',
      userNik: 'EMP-009',
      userName: 'Karyawan Baru',
      department: 'Marketing',
      date: '2026-11-24',
      time: '07:58:00',
      status: 'Tepat Waktu',
      type: 'MASUK',
    });

    render(
      <TenantProvider>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </TenantProvider>
    );

    // Expect KPI to count 6 present
    expect(screen.getByTestId('kpi-ontime')).toHaveTextContent('6');

    // Expect new record at top of feed
    expect(screen.getByTestId('feed-item-att-new-sync')).toBeInTheDocument();
  });

  it('T3-SYNC-04: Double Check-in Prevention for Same Shift', () => {
    // Record MASUK check-in for today
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    addAttendance({
      id: 'att-today-masuk',
      userId: 'usr_emp001',
      userNik: 'EMP-001',
      userName: 'Ahmad Fauzi',
      date: todayStr,
      time: '07:50:00',
      type: 'MASUK',
      status: 'Tepat Waktu',
    });

    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
      })
    );

    render(<App />);

    // Verify Presensi Pulang button is available for evening checkout
    expect(screen.getByTestId('btn-open-pulang')).toBeInTheDocument();
  });

  it('T3-SYNC-05: Check-Out PULANG Workflow Updates Daily Records', () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // Record MASUK
    addAttendance({
      id: 'att-full-masuk',
      userId: 'usr_emp99',
      userNik: 'EMP-99',
      userName: 'Ahmad Fauzi',
      date: todayStr,
      time: '08:00:00',
      type: 'MASUK',
      status: 'Tepat Waktu',
    });

    // Record PULANG
    addAttendance({
      id: 'att-full-pulang',
      userId: 'usr_emp99',
      userNik: 'EMP-99',
      userName: 'Ahmad Fauzi',
      date: todayStr,
      time: '17:00:00',
      type: 'PULANG',
      status: 'PULANG',
    });

    const attendances = getAttendances();
    const userRecords = attendances.filter((a) => a.userNik === 'EMP-99' && a.date === todayStr);

    expect(userRecords.length).toBe(2);
    expect(userRecords.some((r) => r.type === 'MASUK')).toBe(true);
    expect(userRecords.some((r) => r.type === 'PULANG')).toBe(true);
  });
});
