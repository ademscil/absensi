/**
 * AuthContext - Authentication & Role Management
 * Manages user session, quick-fill demo credentials, role switching, and session persistence.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  getUsers,
  getCurrentUser as getStoredCurrentUser,
  setCurrentUser as setStoredCurrentUser,
  clearCurrentUser as clearStoredCurrentUser
} from '../utils/storage.js';

export const AuthContext = createContext(null);

export const demoAccounts = [
  {
    nik: 'ADM-001',
    name: 'Siti Rahma, S.Psi',
    email: 'siti.rahma@absensi.id',
    password: 'password123',
    role: 'admin',
    position: 'HR & People Operations Manager',
    department: 'HR & People Operations',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    nik: 'EMP-001',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@absensi.id',
    password: 'password123',
    role: 'karyawan',
    position: 'Senior Software Engineer',
    department: 'Engineering / IT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    nik: 'EMP-002',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@absensi.id',
    password: 'password123',
    role: 'karyawan',
    position: 'Product Marketing Lead',
    department: 'Marketing',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    nik: 'EMP-003',
    name: 'Budi Santoso',
    email: 'budi.santoso@absensi.id',
    password: 'password123',
    role: 'karyawan',
    position: 'Operations Supervisor',
    department: 'Operations',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    nik: 'EMP-004',
    name: 'Rina Wijaya',
    email: 'rina.wijaya@absensi.id',
    password: 'password123',
    role: 'karyawan',
    position: 'Financial Analyst',
    department: 'Finance',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(() => {
    return getStoredCurrentUser();
  });

  const role = currentUser?.role || null;
  const isAuthenticated = Boolean(currentUser);

  const setCurrentUser = useCallback((user) => {
    setCurrentUserState(user);
    if (user) {
      setStoredCurrentUser(user);
    } else {
      clearStoredCurrentUser();
    }
  }, []);

  const login = useCallback(({ nikOrEmail, password }) => {
    if (!nikOrEmail || !password) {
      return { success: false, error: 'NIK/Email dan kata sandi wajib diisi.' };
    }

    const cleanInput = nikOrEmail.trim().toLowerCase();
    const users = getUsers();
    const safeUsers = Array.isArray(users) ? users : [];

    // Match against stored users or demo accounts
    let matchedUser = safeUsers.find(
      (u) =>
        u.nik?.toLowerCase() === cleanInput ||
        u.email?.toLowerCase() === cleanInput
    );

    if (!matchedUser) {
      const demoMatch = demoAccounts.find(
        (d) =>
          d.nik.toLowerCase() === cleanInput ||
          d.email.toLowerCase() === cleanInput
      );
      if (demoMatch) {
        matchedUser = {
          id: `usr_${demoMatch.nik.toLowerCase().replace('-', '_')}`,
          tenantId: 'corporate',
          annualLeaveQuota: 12,
          annualLeaveRemaining: 10,
          ...demoMatch
        };
      }
    }

    if (!matchedUser) {
      return { success: false, error: 'Akun tidak ditemukan. Gunakan NIK demo seperti ADM-001 atau EMP-001.' };
    }

    // Validate demo password (default password: 'password123')
    if (password !== 'password123') {
      return { success: false, error: 'Kata sandi salah. Kata sandi demo: password123' };
    }

    setCurrentUserState(matchedUser);
    setStoredCurrentUser(matchedUser);
    return { success: true, user: matchedUser };
  }, []);

  const logout = useCallback(() => {
    setCurrentUserState(null);
    clearStoredCurrentUser();
  }, []);

  const switchRole = useCallback((newRole) => {
    const users = getUsers();
    const safeUsers = Array.isArray(users) ? users : [];
    if (newRole === 'admin') {
      const adminUser = safeUsers.find((u) => u.role === 'admin') || demoAccounts[0];
      setCurrentUserState(adminUser);
      setStoredCurrentUser(adminUser);
    } else {
      const empUser = safeUsers.find((u) => u.role === 'karyawan') || demoAccounts[1];
      setCurrentUserState(empUser);
      setStoredCurrentUser(empUser);
    }
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      role,
      isAuthenticated,
      login,
      logout,
      switchRole,
      setCurrentUser,
      demoAccounts
    }),
    [currentUser, role, isAuthenticated, login, logout, switchRole, setCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
