import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm.jsx';
import { LeaveApprovalHub } from '@/components/admin/LeaveApprovalHub.jsx';
import { TenantProvider } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { initStorage, setUsers, setLeaves } from '@/utils/storage.js';

describe('Tier 2 - R3 Boundaries: Form Validations & Quota Exceeded Rules', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T2-R3-01: Empty / Whitespace-Only Leave Reason Validation', async () => {
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

    await user.type(screen.getByTestId('leave-start-date'), '2026-12-02');
    await user.type(screen.getByTestId('leave-end-date'), '2026-12-03');
    await user.type(screen.getByTestId('leave-reason-input'), '    ');

    const submitBtn = screen.getByTestId('btn-submit-leave');
    await user.click(submitBtn);

    expect(screen.getByTestId('leave-form-error')).toHaveTextContent(
      'Alasan cuti wajib diisi minimal 5 karakter'
    );
  });

  it('T2-R3-02: End Date Preceding Start Date Rejection', async () => {
    const user = userEvent.setup();

    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveRequestForm />
        </AuthProvider>
      </TenantProvider>
    );

    await user.type(screen.getByTestId('leave-start-date'), '2026-12-10');
    await user.type(screen.getByTestId('leave-end-date'), '2026-12-05');

    // Inline warning & disabled button
    expect(
      screen.getByText('Tanggal selesai tidak boleh lebih awal dari tanggal mulai')
    ).toBeInTheDocument();
    expect(screen.getByTestId('calculated-duration')).toHaveTextContent('0 Hari');
    expect(screen.getByTestId('btn-submit-leave')).toBeDisabled();
  });

  it('T2-R3-03: Leave Duration Exceeding Remaining Quota', async () => {
    const user = userEvent.setup();

    // User has 3 days left
    setUsers([
      {
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveRemaining: 3,
      },
    ]);

    localStorage.setItem(
      'absensi_v1_current_user',
      JSON.stringify({
        id: 'usr_emp001',
        nik: 'EMP-001',
        name: 'Ahmad Fauzi',
        role: 'karyawan',
        annualLeaveRemaining: 3,
      })
    );

    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveRequestForm />
        </AuthProvider>
      </TenantProvider>
    );

    // Apply for 5 working days (Monday 2026-12-07 to Friday 2026-12-11)
    await user.type(screen.getByTestId('leave-start-date'), '2026-12-07');
    await user.type(screen.getByTestId('leave-end-date'), '2026-12-11');

    expect(
      screen.getByText(/Sisa cuti tidak mencukupi \(Tersisa: 3 hari, Diajukan: 5 hari\)/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('btn-submit-leave')).toBeDisabled();
  });

  it('T2-R3-04: Overlapping Pending / Approved Leave Request Block', async () => {
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

    // Seed approved leave for 2026-12-01 to 2026-12-05
    setLeaves([
      {
        id: 'exist-lve',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        status: 'approved',
      },
    ]);

    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveRequestForm />
        </AuthProvider>
      </TenantProvider>
    );

    // Try applying for overlapping dates 2026-12-03 to 2026-12-04
    await user.type(screen.getByTestId('leave-start-date'), '2026-12-03');
    await user.type(screen.getByTestId('leave-end-date'), '2026-12-04');
    await user.type(screen.getByTestId('leave-reason-input'), 'Keperluan tumpang tindih');

    await user.click(screen.getByTestId('btn-submit-leave'));

    expect(screen.getByTestId('leave-form-error')).toHaveTextContent(
      'Anda sudah memiliki pengajuan cuti pada rentang tanggal tersebut'
    );
  });

  it('T2-R3-05: Admin Leave Rejection Without Notes', async () => {
    const user = userEvent.setup();

    setLeaves([
      {
        id: 'lve-pending-reject',
        userId: 'usr_emp001',
        userNik: 'EMP-001',
        userName: 'Ahmad Fauzi',
        type: 'cuti',
        durationDays: 2,
        startDate: '2026-12-15',
        endDate: '2026-12-16',
        reason: 'Urusan keluarga',
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

    // Click Tolak
    await user.click(screen.getByTestId('btn-reject-lve-pending-reject'));

    // Leave notes empty, click confirm reject
    const confirmBtn = screen.getByTestId('btn-confirm-reject');
    await user.click(confirmBtn);

    // Expect validation message
    expect(screen.getByTestId('approval-error-msg')).toHaveTextContent(
      'Harap cantumkan alasan/catatan penolakan'
    );
  });

  it('T2-R3-06: Weekend-Only Date Range Calculation', async () => {
    const user = userEvent.setup();

    render(
      <TenantProvider>
        <AuthProvider>
          <LeaveRequestForm />
        </AuthProvider>
      </TenantProvider>
    );

    // Select Saturday to Sunday: 2026-12-05 to 2026-12-06
    await user.type(screen.getByTestId('leave-start-date'), '2026-12-05');
    await user.type(screen.getByTestId('leave-end-date'), '2026-12-06');

    expect(screen.getByTestId('calculated-duration')).toHaveTextContent('0 Hari');
    expect(
      screen.getByText('Rentang tanggal hanya memuat hari libur akhir pekan')
    ).toBeInTheDocument();
    expect(screen.getByTestId('btn-submit-leave')).toBeDisabled();
  });
});
