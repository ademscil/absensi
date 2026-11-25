import React, { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTenant } from '../../context/TenantContext.jsx';

/**
 * TenantSwitcher - Multi-tenant white-label preset switcher
 * Horizon UI & TailAdmin unified dropdown design:
 * - Single sleek rounded-full dropdown button with theme color dot
 * - Hidden indicator retaining full compatibility for screen readers & tests
 * - Smooth hover and focus states
 * - Cross-tab storage sync
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
      className={`tenant-switcher inline-flex items-center ${className}`}
    >
      {/* Active Theme Color & Organization Indicator (accessible for tests and screen readers) */}
      {showIndicator && (
        <div
          data-testid="active-preset-indicator"
          className="sr-only"
        >
          <span
            data-testid="active-preset-dot"
            style={{ backgroundColor: currentTenant.colors?.primary || '#2563EB' }}
          />
          <span>{currentTenant.name}</span>
        </div>
      )}

      {/* Horizon UI Signature Dropdown Pill */}
      <div className="relative inline-flex items-center">
        <label htmlFor="tenant-select" className="sr-only">
          Pilih Preset Tenant
        </label>
        <span
          className="w-2 h-2 rounded-full absolute left-2.5 pointer-events-none z-10 shadow-2xs ring-2 ring-primary/20"
          style={{ backgroundColor: currentTenant.colors?.primary || '#2563EB' }}
        />
        <select
          id="tenant-select"
          data-testid="tenant-select"
          value={currentTenant.id}
          onChange={handleSelectChange}
          className="max-w-[112px] sm:max-w-none truncate pl-6 pr-7 py-1 text-xs font-semibold rounded-full bg-white text-slate-700 hover:text-slate-900 shadow-2xs border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
        >
          <option value="corporate">Korporat Swasta</option>
          <option value="pemerintah">Instansi Pemerintah</option>
          <option value="sekolah">Institusi Pendidikan</option>
          <option value="retail">Bisnis Retail & F&B</option>
        </select>
        <ChevronDown
          className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2 z-10"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default TenantSwitcher;
