/**
 * TenantContext - Multi-Tenant Theme Engine
 * Provides reactive tenant state, instant preset switching, and dynamic CSS token injection.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  TENANT_PRESETS,
  DEFAULT_TENANT_ID,
  getTenantPreset,
  getAllTenantPresets
} from '../data/tenantPresets.js';
import { getStoredTenant, setStoredTenant } from '../utils/storage.js';

export const TenantContext = createContext(null);

/**
 * Convert Hex Color to RGB format string (e.g., "30, 64, 175")
 * @param {string} hex 
 * @returns {string}
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return '59, 130, 246';
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return '59, 130, 246';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

/**
 * Apply tenant theme variables to document root
 * @param {Object} tenant 
 */
export function applyTenantTheme(tenant) {
  if (typeof document === 'undefined' || !tenant || !tenant.colors) return;
  const root = document.documentElement;
  const primaryRgb = hexToRgb(tenant.colors.primary);
  const secondaryRgb = hexToRgb(tenant.colors.secondary);
  const accentRgb = hexToRgb(tenant.colors.accent);

  root.style.setProperty('--color-primary', tenant.colors.primary);
  root.style.setProperty('--color-primary-rgb', primaryRgb);
  root.style.setProperty('--color-primary-light', `rgba(${primaryRgb}, 0.15)`);
  root.style.setProperty('--color-secondary', tenant.colors.secondary);
  root.style.setProperty('--color-secondary-rgb', secondaryRgb);
  root.style.setProperty('--color-accent', tenant.colors.accent);
  root.style.setProperty('--color-accent-rgb', accentRgb);
  root.style.setProperty('--color-bg-gradient', tenant.colors.bgGradient);
  root.style.setProperty('--color-card-bg', tenant.colors.cardBg);
  root.style.setProperty(
    '--shadow-spatial-depth',
    `0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(${primaryRgb}, 0.2)`
  );
  root.style.setProperty('--shadow-glow', `0 0 24px rgba(${primaryRgb}, 0.4)`);
}

export function TenantProvider({ children }) {
  const [currentTenant, setCurrentTenantState] = useState(() => {
    const storedId = getStoredTenant();
    return getTenantPreset(storedId);
  });

  // Apply theme dynamically to root whenever tenant changes
  useEffect(() => {
    applyTenantTheme(currentTenant);
  }, [currentTenant]);

  const setTenant = useCallback((presetId) => {
    const preset = getTenantPreset(presetId);
    setCurrentTenantState(preset);
    setStoredTenant(preset.id);
    applyTenantTheme(preset);
  }, []);

  const value = useMemo(
    () => ({
      currentTenant,
      setTenant,
      tenantId: currentTenant.id,
      labels: currentTenant.labels,
      colors: currentTenant.colors,
      brand: currentTenant,
      tenants: getAllTenantPresets(),
      presets: TENANT_PRESETS
    }),
    [currentTenant, setTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
