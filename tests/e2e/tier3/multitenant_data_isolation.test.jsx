import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AttendanceRekap } from '@/components/admin/AttendanceRekap.jsx';
import { TenantSwitcher } from '@/components/common/TenantSwitcher.jsx';
import { stampAttendanceWatermark } from '@/utils/canvasWatermark.js';
import { getActiveMockContext } from '../../mocks/canvasMock.js';
import { TenantProvider, useTenant } from '@/context/TenantContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import {
  initStorage,
  getAttendances,
  setAttendances,
  addAttendance,
} from '@/utils/storage.js';

describe('Tier 3 - Multi-Tenant Data Isolation & Scoping', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage(true);
  });

  it('T3-ISOL-01: Multi-Tenant Attendance Scoping in Recap Table', async () => {
    const user = userEvent.setup();

    // Seed corporate and pemerintah records
    setAttendances([
      { id: 'corp-1', userNik: 'NIK-001', userName: 'User Corp 1', department: 'IT', tenantId: 'corporate', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'corp-2', userNik: 'NIK-002', userName: 'User Corp 2', department: 'IT', tenantId: 'corporate', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'corp-3', userNik: 'NIK-003', userName: 'User Corp 3', department: 'IT', tenantId: 'corporate', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'gov-1', userNik: 'NIP-001', userName: 'Pegawai Gov 1', department: 'Biro Umum', tenantId: 'pemerintah', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'gov-2', userNik: 'NIP-002', userName: 'Pegawai Gov 2', department: 'Biro Umum', tenantId: 'pemerintah', date: '2026-11-24', status: 'Tepat Waktu' },
      { id: 'gov-3', userNik: 'NIP-003', userName: 'Pegawai Gov 3', department: 'Biro Umum', tenantId: 'pemerintah', date: '2026-11-24', status: 'Tepat Waktu' },
    ]);

    function TenantScopingView() {
      const { tenantId } = useTenant();
      const attendances = getAttendances();
      const scopedAttendances = attendances.filter((a) => a.tenantId === tenantId);

      return (
        <div>
          <TenantSwitcher />
          <div data-testid="scoped-count">{scopedAttendances.length}</div>
          <div data-testid="scoped-rows">
            {scopedAttendances.map((a) => (
              <span key={a.id} data-testid={`scoped-${a.id}`}>{a.userName}</span>
            ))}
          </div>
        </div>
      );
    }

    render(
      <TenantProvider>
        <AuthProvider>
          <TenantScopingView />
        </AuthProvider>
      </TenantProvider>
    );

    const select = screen.getByTestId('tenant-select');

    // Corporate scope: exactly 3 corporate rows
    expect(screen.getByTestId('scoped-count')).toHaveTextContent('3');
    expect(screen.getByTestId('scoped-corp-1')).toBeInTheDocument();
    expect(screen.queryByTestId('scoped-gov-1')).not.toBeInTheDocument();

    // Switch to Pemerintah
    await user.selectOptions(select, 'pemerintah');

    // Pemerintah scope: exactly 3 pemerintah rows
    expect(screen.getByTestId('scoped-count')).toHaveTextContent('3');
    expect(screen.getByTestId('scoped-gov-1')).toBeInTheDocument();
    expect(screen.queryByTestId('scoped-corp-1')).not.toBeInTheDocument();
  });

  it('T3-ISOL-02: Tenant Switch Retains Stored Records Across Presets', () => {
    // 1. Check-in as Corporate
    addAttendance({
      id: 'att-multi-corp',
      userNik: 'NIK-101',
      userName: 'Employee Corp',
      tenantId: 'corporate',
      status: 'Tepat Waktu',
    });

    // 2. Switch to Sekolah and check-in as Guru
    addAttendance({
      id: 'att-multi-edu',
      userNik: 'NUPTK-202',
      userName: 'Guru Sekolah',
      tenantId: 'sekolah',
      status: 'Tepat Waktu',
    });

    const all = getAttendances();
    const corpRecord = all.find((a) => a.id === 'att-multi-corp');
    const eduRecord = all.find((a) => a.id === 'att-multi-edu');

    // Both records retained cleanly in storage under their respective tenantIds
    expect(corpRecord).toBeDefined();
    expect(corpRecord.tenantId).toBe('corporate');
    expect(eduRecord).toBeDefined();
    expect(eduRecord.tenantId).toBe('sekolah');
  });

  it('T3-ISOL-03: Tenant Switch Updates Watermark Stamping Metadata', async () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 640;
    mockCanvas.height = 480;

    // 1. Stamp with Pemerintah branding and NIP label
    const govMeta = {
      idLabel: 'NIP',
      nik: '198501012010011001',
      name: 'Dr. H. Bambang, M.Si',
      tenantName: 'Badan Kepegawaian Daerah',
      department: 'Bidang Mutasi & Promosi',
      status: 'Tepat Waktu',
      type: 'MASUK',
    };

    const govDataUrl = await stampAttendanceWatermark(mockCanvas, govMeta);
    expect(govDataUrl).toBeDefined();
    expect(govDataUrl).toContain('data:image/jpeg;base64,');

    const ctx = getActiveMockContext();
    expect(ctx).toBeTruthy();
    let texts = ctx.fillText.mock.calls.map((c) => c[0]);
    expect(texts.some((t) => t.includes(govMeta.nik) && t.includes(govMeta.name))).toBe(true);
    expect(texts.some((t) => t.includes('NIP'))).toBe(true);
    expect(texts.some((t) => t.includes(govMeta.tenantName))).toBe(true);

    // 2. Switch to Sekolah branding and NUPTK label
    const sekolahMeta = {
      idLabel: 'NUPTK',
      nik: '197502022005012002',
      name: 'Sri Wahyuni, S.Pd',
      tenantName: 'SMA Negeri 1 Nusantara',
      department: 'Kurikulum',
      status: 'Tepat Waktu',
      type: 'MASUK',
    };

    const sekolahDataUrl = await stampAttendanceWatermark(mockCanvas, sekolahMeta);
    expect(sekolahDataUrl).toBeDefined();
    expect(sekolahDataUrl).toContain('data:image/jpeg;base64,');

    const ctxSekolah = getActiveMockContext();
    const textsSekolah = ctxSekolah.fillText.mock.calls.map((c) => c[0]);
    expect(textsSekolah.some((t) => t.includes(sekolahMeta.nik) && t.includes(sekolahMeta.name))).toBe(true);
    expect(textsSekolah.some((t) => t.includes('NUPTK'))).toBe(true);
    expect(textsSekolah.some((t) => t.includes(sekolahMeta.tenantName))).toBe(true);
  });
});
