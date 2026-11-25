import React, { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTenant } from '../../context/TenantContext.jsx';

/**
 * TenantSwitcher - Multi-tenant white-label preset switcher
 * Features:
 * - Dropdown selection with accessible <select data-testid="tenant-select">
 * - Visual active preset indicator badge with theme color dot
 * - Unified modern segmented control appearance
 * - Instant CSS variable theme transition across 4 presets
 * - Cross-tab LocalStorage synchronization
 */
export function TenantSwitcher({
  'data-testid': testId = 'tenant-switcher',
  className = '',
  showIndicator = true,
}) {
  const { currentTenant, setTenant } = useTenant();

  // Cross-tab storage sync
  useEffect(() => {
    const handleStorage = (e) => {
      if ((e.key === 'absensi_v1_tenant' || e.key === 'absensi_tenant_v1') && e.newValue) {
        setTenant(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setTenant]);

  const handleSelectChange = (e) => {
    setTenant(e.target.value);
  };

  return (
    <div
      data-testid={testId}
      className={`tenant-switcher inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/90 shadow-2xs ${className}`}
    >
      {/* Visual Indicator of Active Preset */}
      {showIndicator && (
        <div
          data-testid="active-preset-indicator"
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/60 text-[11px] font-semibold text-slate-700 transition-colors duration-200 shadow-2xs"
        >
          <span
            data-testid="active-preset-dot"
            className="w-2.5 h-2.5 rounded-full transition-colors duration-300 ring-2 ring-primary/20 shadow-2xs"
            style={{ backgroundColor: currentTenant.colors?.primary || '#2563EB' }}
          />
          <span className="font-semibold text-slate-800">{currentTenant.name}</span>
        </div>
      )}

      {/* Accessible native select */}
      <div className="relative inline-flex items-center">
        <label htmlFor="tenant-select" className="sr-only">
          Pilih Preset Tenant
        </label>
        <select
          id="tenant-select"
          data-testid="tenant-select"
          value={currentTenant.id}
          onChange={handleSelectChange}
          className="max-w-[112px] sm:max-w-none truncate pl-2.5 pr-7 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200/60 text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-2xs appearance-none"
        >
          <option value="corporate">Korporat Swasta</option>
          <option value="pemerintah">Instansi Pemerintah</option>
          <option value="sekolah">Institusi Pendidikan</option>
          <option value="retail">Bisnis Retail & F&B</option>
        </select>
        <ChevronDown
          className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default TenantSwitcher;
