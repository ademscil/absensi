import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm.jsx';
import { LeaveStatusList } from '@/components/leave/LeaveStatusList.jsx';
import { LeaveApprovalHub } from '@/components/admin/LeaveApprovalHub.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import {
  initStorage,
  getUsers,
  setUsers,
  getLeaves,
  setLeaves,
} from '@/utils/storage.js';

describe('Tier 4 - Workflow 2: Complete Leave Request & Approval Lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T4-E2E-03: Leave Submission, HR Inspection, Approval & Quota Deduction', async () => {
    const user = userEvent.setup();

    // 1. Karyawan initial balance: 12 days
    setUsers([
      {
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveQuota: 12,
        annualLeaveRemaining: 12,
      },
      {
        id: 'usr_adm001',
        nik: 'ADM-001',
        name: 'Siti Rahma',
        role: 'admin',
      },
    ]);
    setLeaves([]);

    // 2. Karyawan logs in and submits leave
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

    function KaryawanLeaveView() {
      const [key, setKey] = React.useState(0);
      return (
        <div>
          <LeaveRequestForm onSubmitted={() => setKey((k) => k + 1)} />
          <LeaveStatusList refreshKey={key} />
        </div>
      );
    }

    const { unmount: unmountKaryawan } = render(
      <TenantProvider>
        <AuthProvider>
          <KaryawanLeaveView />
        </AuthProvider>
      </TenantProvider>
    );

    expect(screen.getByTestId('leave-quota-badge')).toHaveTextContent('Sisa Cuti: 12 Hari');

    // Fill form: 3 working days (2026-12-02 to 2026-12-04)
    await user.type(screen.getByTestId('leave-start-date'), '2026-12-02');
    await user.type(screen.getByTestId('leave-end-date'), '2026-12-04');
    await user.type(screen.getByTestId('leave-reason-input'), 'Liburan tahunan bersama keluarga');
    await user.click(screen.getByTestId('btn-submit-leave'));

    // Verify status in list shows "Menunggu Persetujuan"
    await waitFor(() => {
      expect(screen.getByText('Menunggu Persetujuan')).toBeInTheDocument();
    });

    unmountKaryawan();

    // 3. Admin HR opens Approval Hub
    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_adm001',
        nik: 'ADM-001',
        name: 'Siti Rahma',
        role: 'admin',
      })
    );

    const { unmount: unmountAdmin } = render(
      <TenantProvider>
        <AuthProvider>
          <LeaveApprovalHub />
        </AuthProvider>
      </TenantProvider>
    );

    expect(screen.getByTestId('pending-count-badge')).toHaveTextContent('1 Menunggu');

    // Review & approve
    const leaves = getLeaves();
    const pendingId = leaves[0].id;
    await user.click(screen.getByTestId(`btn-approve-${pendingId}`));
    await user.type(screen.getByTestId('hr-notes-input'), 'Disetujui. Selamat berlibur.');
    await user.click(screen.getByTestId('btn-confirm-approve'));

    unmountAdmin();

    // 4. Karyawan views updated balance & status
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
          <div>
            <LeaveRequestForm />
            <LeaveStatusList />
          </div>
        </AuthProvider>
      </TenantProvider>
    );

    // Shows Disetujui
    expect(screen.getByText('Disetujui')).toBeInTheDocument();
    expect(screen.getByTestId('hr-review-notes')).toHaveTextContent('Disetujui. Selamat berlibur.');

    // Annual leave quota decremented to 9 Hari
    expect(screen.getByTestId('leave-quota-badge')).toHaveTextContent('Sisa Cuti: 9 Hari');
  });

  it('T4-E2E-04: Leave Rejection Workflow with Explanation Notes', async () => {
    const user = userEvent.setup();

    setUsers([
      {
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveQuota: 12,
        annualLeaveRemaining: 10,
      },
    ]);

    // Submit request
    setLeaves([
      {
        id: 'lve-reject-cycle',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        type: 'izin',
        durationDays: 2,
        startDate: '2026-12-08',
        endDate: '2026-12-09',
        reason: 'Izin urusan pribadi mendadak',
        status: 'pending',
      },
    ]);

    // Admin rejects request with explanation notes
    const { unmount } = render(
      <TenantProvider>
        <AuthProvider>
          <LeaveApprovalHub />
        </AuthProvider>
      </TenantProvider>
    );

    await user.click(screen.getByTestId('btn-reject-lve-reject-cycle'));
    await user.type(
      screen.getByTestId('hr-notes-input'),
      'Mohon dijadwalkan ulang setelah rilis sistem.'
    );
    await user.click(screen.getByTestId('btn-confirm-reject'));

    unmount();

    // Employee views dashboard
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
          <div>
            <LeaveRequestForm />
            <LeaveStatusList />
          </div>
        </AuthProvider>
      </TenantProvider>
    );

    expect(screen.getByText('Ditolak')).toBeInTheDocument();
    expect(screen.getByTestId('hr-review-notes')).toHaveTextContent(
      'Mohon dijadwalkan ulang setelah rilis sistem.'
    );

    // Quota unchanged at 10
    expect(screen.getByTestId('leave-quota-badge')).toHaveTextContent('Sisa Cuti: 10 Hari');
  });
});
