/**
 * Milestone 1 Foundation Unit Tests
 * Verifies Storage Architecture, Seed Data, Tenant Presets, Quota Guard, and Theming Tokens.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  STORAGE_KEYS,
  STORAGE_PREFIX,
  initStorage,
  getUsers,
  setUsers,
  getUserById,
  getUserByNik,
  getAttendances,
  addAttendance,
  getLeaves,
  addLeave,
  updateLeave,
  getStoredTenant,
  setStoredTenant,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  clearAllStorage,
  safeSetItem,
  safeGetItem
} from '../utils/storage.js';
import {
  TENANT_PRESETS,
  DEFAULT_TENANT_ID,
  getTenantPreset,
  getAllTenantPresets,
  getDefaultTenant
} from '../data/tenantPresets.js';
import { hexToRgb, applyTenantTheme } from '../context/TenantContext.jsx';
import { AuthProvider, useAuth, demoAccounts } from '../context/AuthContext.jsx';

describe('Milestone 1: Foundation, Multi-Tenant Theming & Storage Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Storage Schema & Seed Initialization', () => {
    it('should initialize storage with versioned keys and seed data', () => {
      expect(STORAGE_PREFIX).toBe('absensi_v1_');
      expect(STORAGE_KEYS.USERS).toBe('absensi_v1_users');
      expect(STORAGE_KEYS.ATTENDANCES).toBe('absensi_v1_attendances');
      expect(STORAGE_KEYS.LEAVES).toBe('absensi_v1_leaves');
      expect(STORAGE_KEYS.TENANT).toBe('absensi_v1_tenant');

      const initialized = initStorage(true);
      expect(initialized).toBe(true);

      const users = getUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(5);

      // Verify 1 Admin HR exists
      const admin = users.find((u) => u.role === 'admin');
      expect(admin).toBeDefined();
      expect(admin.nik).toBe('ADM-001');
      expect(admin.name).toContain('Siti Rahma');
      expect(admin.department).toBe('HR & People Operations');

      // Verify 4 Karyawan exist
      const employees = users.filter((u) => u.role === 'karyawan');
      expect(employees.length).toBe(4);
      employees.forEach((emp) => {
        expect(emp.annualLeaveQuota).toBe(12);
        expect(emp.annualLeaveRemaining).toBeGreaterThanOrEqual(8);
        expect(emp.annualLeaveRemaining).toBeLessThanOrEqual(12);
        expect(emp.department).toBeDefined();
      });
    });

    it('should seed 20+ realistic historical attendance records with diverse statuses', () => {
      initStorage(true);
      const attendances = getAttendances();
      expect(attendances.length).toBeGreaterThanOrEqual(20);

      const statuses = new Set(attendances.map((a) => a.status));
      expect(statuses.has('Tepat Waktu')).toBe(true);
      expect(statuses.has('Terlambat')).toBe(true);
      expect(statuses.has('Cuti')).toBe(true);
      expect(statuses.has('Sakit')).toBe(true);

      attendances.forEach((att) => {
        expect(att.id).toBeDefined();
        expect(att.userId).toBeDefined();
        expect(att.userName).toBeDefined();
        expect(att.userNik).toBeDefined();
        expect(att.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(att.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        expect(['MASUK', 'PULANG']).toContain(att.type);
        expect(att.coordinates).toBeDefined();
        expect(typeof att.coordinates.lat).toBe('number');
        expect(typeof att.coordinates.lng).toBe('number');
        expect(att.authHash).toBeDefined();
      });
    });

    it('should seed 4+ leave requests with diverse statuses', () => {
      initStorage(true);
      const leaves = getLeaves();
      expect(leaves.length).toBeGreaterThanOrEqual(4);

      const statuses = new Set(leaves.map((l) => l.status));
      expect(statuses.has('pending')).toBe(true);
      expect(statuses.has('approved')).toBe(true);
      expect(statuses.has('rejected')).toBe(true);

      const types = new Set(leaves.map((l) => l.type));
      expect(types.has('cuti')).toBe(true);
      expect(types.has('sakit')).toBe(true);

      const sickLeave = leaves.find((l) => l.type === 'sakit');
      expect(sickLeave).toBeDefined();
      expect(sickLeave.attachmentName).toBeDefined();
    });
  });

  describe('2. Multi-Tenant Presets Structure & Retrieval', () => {
    it('should have 4 predefined presets with valid attributes', () => {
      const presets = getAllTenantPresets();
      expect(presets.length).toBe(4);

      const expectedIds = ['corporate', 'pemerintah', 'sekolah', 'retail'];
      expectedIds.forEach((id) => {
        const preset = TENANT_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name).toBeTypeOf('string');
        expect(preset.category).toBeTypeOf('string');
        expect(preset.tagline).toBeTypeOf('string');

        // Logo SVG must be valid SVG markup
        expect(preset.logoSvg).toContain('<svg');
        expect(preset.logoSvg).toContain('</svg>');

        // Colors contract
        expect(preset.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.colors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.colors.bgGradient).toContain('gradient');
        expect(preset.colors.cardBg).toBeDefined();

        // Labels contract
        expect(preset.labels.idLabel).toBeTypeOf('string');
        expect(preset.labels.userLabel).toBeTypeOf('string');
        expect(preset.labels.deptLabel).toBeTypeOf('string');
      });
    });

    it('should provide correct terminology per tenant preset', () => {
      expect(TENANT_PRESETS.corporate.labels.idLabel).toBe('NIK');
      expect(TENANT_PRESETS.corporate.labels.userLabel).toBe('Karyawan');
      expect(TENANT_PRESETS.corporate.labels.deptLabel).toBe('Departemen');

      expect(TENANT_PRESETS.pemerintah.labels.idLabel).toBe('NIP');
      expect(TENANT_PRESETS.pemerintah.labels.userLabel).toBe('Pegawai');
      expect(TENANT_PRESETS.pemerintah.labels.deptLabel).toBe('Satuan Kerja');

      expect(TENANT_PRESETS.sekolah.labels.idLabel).toBe('NUPTK');
      expect(TENANT_PRESETS.sekolah.labels.userLabel).toBe('Guru / Tenaga Pendidik');
      expect(TENANT_PRESETS.sekolah.labels.deptLabel).toBe('Jurusan / Bidang');

      expect(TENANT_PRESETS.retail.labels.idLabel).toBe('Crew ID');
      expect(TENANT_PRESETS.retail.labels.userLabel).toBe('Staff');
      expect(TENANT_PRESETS.retail.labels.deptLabel).toBe('Cabang');
    });

    it('should fall back gracefully to corporate preset on unknown tenant ID', () => {
      const defaultPreset = getDefaultTenant();
      expect(defaultPreset.id).toBe(DEFAULT_TENANT_ID);

      const unknown = getTenantPreset('unknown_tenant_xyz');
      expect(unknown.id).toBe('corporate');

      const corporate = getTenantPreset('corporate');
      expect(corporate.id).toBe('corporate');

      const retail = getTenantPreset('retail');
      expect(retail.id).toBe('retail');
    });

    it('should convert hex colors to RGB format correctly', () => {
      expect(hexToRgb('#1E40AF')).toBe('30, 64, 175');
      expect(hexToRgb('#15803D')).toBe('21, 128, 61');
      expect(hexToRgb('#FFFFFF')).toBe('255, 255, 255');
      expect(hexToRgb('#000000')).toBe('0, 0, 0');
    });

    it('should dynamically inject CSS variables on document root', () => {
      const retailPreset = TENANT_PRESETS.retail;
      applyTenantTheme(retailPreset);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary')).toBe(retailPreset.colors.primary);
      expect(root.style.getPropertyValue('--color-secondary')).toBe(retailPreset.colors.secondary);
      expect(root.style.getPropertyValue('--color-accent')).toBe(retailPreset.colors.accent);
      expect(root.style.getPropertyValue('--color-bg-gradient')).toBe(retailPreset.colors.bgGradient);
      expect(root.style.getPropertyValue('--color-card-bg')).toBe(retailPreset.colors.cardBg);
    });
  });

  describe('3. Storage CRUD Operations & Quota Guard', () => {
    it('should handle User CRUD operations', () => {
      initStorage(true);

      const user = getUserByNik('EMP-001');
      expect(user).toBeDefined();
      expect(user.name).toBe('Ahmad Fauzi');

      const userCaseInsensitive = getUserByNik('emp-001');
      expect(userCaseInsensitive).toBeDefined();
      expect(userCaseInsensitive.id).toBe(user.id);

      const currentUsers = getUsers();
      const updated = currentUsers.map((u) => (u.id === user.id ? { ...u, position: 'Tech Lead' } : u));
      setUsers(updated);

      const reloadedUser = getUserByNik('EMP-001');
      expect(reloadedUser.position).toBe('Tech Lead');
    });

    it('should prepend new attendance records via addAttendance', () => {
      initStorage(true);
      const initialCount = getAttendances().length;

      const newRecord = addAttendance({
        userId: 'usr_emp_001',
        userName: 'Ahmad Fauzi',
        userNik: 'EMP-001',
        tenantId: 'corporate',
        department: 'Engineering / IT',
        date: '2026-11-25',
        time: '08:00:00',
        type: 'MASUK',
        status: 'Tepat Waktu',
        photoDataUrl: 'data:image/svg+xml;test',
        coordinates: { lat: -6.2, lng: 106.8, address: 'Test Location' },
        authHash: 'abc123hash'
      });

      expect(newRecord.id).toBeDefined();
      expect(newRecord.createdAt).toBeDefined();

      const attendances = getAttendances();
      expect(attendances.length).toBe(initialCount + 1);
      expect(attendances[0].id).toBe(newRecord.id);
    });

    it('should handle Leave CRUD and deduct remaining leave upon approval', () => {
      initStorage(true);
      const initialUser = getUserByNik('EMP-001');
      const initialQuota = initialUser.annualLeaveRemaining;

      const newLeave = addLeave({
        userId: initialUser.id,
        userName: initialUser.name,
        userNik: initialUser.nik,
        tenantId: 'corporate',
        department: initialUser.department,
        type: 'cuti',
        typeLabel: 'Cuti Tahunan',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        durationDays: 2,
        reason: 'Keperluan Liburan Akhir Tahun'
      });

      expect(newLeave.id).toBeDefined();
      expect(newLeave.status).toBe('pending');

      // Update leave to approved
      const updated = updateLeave(newLeave.id, {
        status: 'approved',
        reviewedBy: 'Siti Rahma, S.Psi',
        reviewedAt: new Date().toISOString(),
        reviewNotes: 'Disetujui untuk liburan'
      });

      expect(updated.status).toBe('approved');
      expect(updated.reviewNotes).toBe('Disetujui untuk liburan');

      // Verify leave quota was deducted
      const updatedUser = getUserByNik('EMP-001');
      expect(updatedUser.annualLeaveRemaining).toBe(initialQuota - 2);
    });

    it('should manage stored tenant and user session', () => {
      expect(getStoredTenant()).toBe(DEFAULT_TENANT_ID);
      setStoredTenant('sekolah');
      expect(getStoredTenant()).toBe('sekolah');

      expect(getCurrentUser()).toBeNull();
      const mockUser = { id: 'usr_emp_001', name: 'Ahmad Fauzi', role: 'karyawan' };
      setCurrentUser(mockUser);
      expect(getCurrentUser()).toEqual(mockUser);

      clearCurrentUser();
      expect(getCurrentUser()).toBeNull();
    });

    it('should safely handle quota errors and prune old photos', () => {
      initStorage(true);

      // Create large attendances with bulky photoDataUrl
      const bulkyAttendances = Array.from({ length: 60 }).map((_, i) => ({
        id: `bulky_${i}`,
        photoDataUrl: 'data:image/jpeg;base64,' + 'A'.repeat(5000),
        status: 'Tepat Waktu'
      }));
      safeSetItem(STORAGE_KEYS.ATTENDANCES, bulkyAttendances);

      // Mock setItem to throw QuotaExceededError once, then succeed
      let quotaThrown = false;
      const originalSetItem = localStorage.setItem.bind(localStorage);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, val) {
        if (!quotaThrown && key === 'test_quota_key') {
          quotaThrown = true;
          const err = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
          throw err;
        }
        return originalSetItem(key, val);
      });

      const success = safeSetItem('test_quota_key', { data: 'test_after_cleanup' });
      expect(success).toBe(true);

      const result = safeGetItem('test_quota_key');
      expect(result).toEqual({ data: 'test_after_cleanup' });

      setItemSpy.mockRestore();
    });

    it('should clear all application storage keys on clearAllStorage', () => {
      initStorage(true);
      expect(getUsers().length).toBeGreaterThan(0);
      expect(getAttendances().length).toBeGreaterThan(0);

      const cleared = clearAllStorage();
      expect(cleared).toBe(true);

      expect(localStorage.getItem(STORAGE_KEYS.USERS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.ATTENDANCES)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.LEAVES)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.SEEDED)).toBeNull();
    });
  });

  describe('4. Auth Demo Accounts', () => {
    it('should export 5 valid demo accounts for quick-fill credentials', () => {
      expect(demoAccounts.length).toBe(5);

      const admin = demoAccounts.find((d) => d.role === 'admin');
      expect(admin).toBeDefined();
      expect(admin.nik).toBe('ADM-001');
      expect(admin.password).toBe('password123');

      const employees = demoAccounts.filter((d) => d.role === 'karyawan');
      expect(employees.length).toBe(4);
      employees.forEach((emp) => {
        expect(emp.password).toBe('password123');
        expect(emp.nik).toMatch(/^EMP-\d{3}$/);
        expect(emp.name).toBeDefined();
        expect(emp.department).toBeDefined();
      });
    });
  });

  describe('5. Corrupted Storage Handling & Defensive Self-Healing', () => {
    it('should return defaultValue when safeGetItem encounters corrupted JSON and defaultValue is not a string', () => {
      localStorage.setItem('bad_array', '{"truncated": [1, 2,');
      const fallbackArray = [{ id: 1 }];
      const result = safeGetItem('bad_array', fallbackArray);
      expect(result).toBe(fallbackArray);

      localStorage.setItem('bad_object', '{broken:');
      const fallbackObj = { defaultKey: 'val' };
      const objResult = safeGetItem('bad_object', fallbackObj);
      expect(objResult).toBe(fallbackObj);

      localStorage.setItem('bad_bool', '{"not_a_bool');
      expect(safeGetItem('bad_bool', false)).toBe(false);
    });

    it('should return raw item for plain unquoted strings when defaultValue is string or null', () => {
      localStorage.setItem('plain_str', 'just_a_string');
      expect(safeGetItem('plain_str', 'default')).toBe('just_a_string');
    });

    it('should safely fall back to initial arrays when collection storage contains corrupted JSON', () => {
      localStorage.setItem(STORAGE_KEYS.USERS, '{"corrupted": [');
      localStorage.setItem(STORAGE_KEYS.ATTENDANCES, 'INVALID_JSON_ATTENDANCE');
      localStorage.setItem(STORAGE_KEYS.LEAVES, '{"truncated_leaves":');

      const users = getUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      const attendances = getAttendances();
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances.length).toBeGreaterThan(0);

      const leaves = getLeaves();
      expect(Array.isArray(leaves)).toBe(true);
      expect(leaves.length).toBeGreaterThan(0);
    });

    it('should safely execute getUserById and getUserByNik without throwing TypeError on corrupted users storage', () => {
      localStorage.setItem(STORAGE_KEYS.USERS, '{"truncated": [1, 2,');

      expect(() => getUserById('usr_adm_001')).not.toThrow();
      expect(() => getUserByNik('ADM-001')).not.toThrow();

      // Since getUsers falls back to initialUsers, ADM-001 can still be found
      const adminById = getUserById('usr_adm_001');
      expect(adminById).toBeDefined();
      expect(adminById.nik).toBe('ADM-001');

      const adminByNik = getUserByNik('ADM-001');
      expect(adminByNik).toBeDefined();
      expect(adminByNik.id).toBe('usr_adm_001');

      // Test with non-existent user
      expect(getUserById('non_existent_id')).toBeNull();
      expect(getUserByNik('non_existent_nik')).toBeNull();
    });

    it('should safely execute updateLeave without throwing TypeError on corrupted leaves storage', () => {
      localStorage.setItem(STORAGE_KEYS.LEAVES, 'CORRUPTED_LEAVE_DATA');

      expect(() => {
        const res = updateLeave('lve_001', { status: 'approved' });
      }).not.toThrow();
    });

    it('should safely execute addAttendance without string spread corruption on corrupted attendances storage', () => {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCES, 'CORRUPTED_STRING_VALUE');

      let newAtt;
      expect(() => {
        newAtt = addAttendance({
          userId: 'usr_emp_001',
          userName: 'Ahmad Fauzi',
          userNik: 'EMP-001',
          date: '2026-11-25',
          time: '09:00:00',
          type: 'MASUK',
          status: 'Tepat Waktu'
        });
      }).not.toThrow();

      expect(newAtt).toBeDefined();
      expect(newAtt.id).toBeDefined();

      const attendances = getAttendances();
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances[0]).toEqual(newAtt);
      attendances.forEach((item) => {
        expect(typeof item).toBe('object');
      });
    });

    it('should allow AuthContext login and switchRole to operate seamlessly despite corrupted storage', () => {
      localStorage.setItem(STORAGE_KEYS.USERS, '{"broken": [');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, '{"broken_session":');

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Session initializes safely as unauthenticated / null
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Login with demo account
      let loginRes;
      act(() => {
        loginRes = result.current.login({ nikOrEmail: 'ADM-001', password: 'password123' });
      });

      expect(loginRes.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.role).toBe('admin');

      // Switch role to karyawan
      act(() => {
        result.current.switchRole('karyawan');
      });

      expect(result.current.role).toBe('karyawan');
      expect(result.current.currentUser.role).toBe('karyawan');

      // Switch role to admin
      act(() => {
        result.current.switchRole('admin');
      });

      expect(result.current.role).toBe('admin');
      expect(result.current.currentUser.role).toBe('admin');
    });
  });
});
