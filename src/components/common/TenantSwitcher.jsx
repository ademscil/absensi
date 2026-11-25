import React, { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTenant } from '../../context/TenantContext.jsx';

/**
 * TenantSwitcher - Multi-tenant white-label preset switcher
 * Modeled after TailAdmin & Horizon UI workspace switcher patterns:
 * - Single sleek rounded-xl dropdown button with theme color dot
 * - Hidden indicator retaining full compatibility for screen readers & tests
 * - Cross-tab storage sync
 */
export function TenantSwitcher({
  'data-testid': testId = 'tenant-switcher',
  className = '',
  showIndicator = true,
}) {
  const { currentTenant, setTenant } = useTenant();

  const presetLabels = {
    corporate: 'Korporat Swasta',
    pemerintah: 'Instansi Pemerintah',
    sekolah: 'Institusi Pendidikan',
    retail: 'Bisnis Retail & F&B',
  };

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

      {/* Modern Workspace Selector Button */}
      <div className="relative inline-flex items-center">
        <label htmlFor="tenant-select" className="sr-only">
          Pilih Preset Tenant
        </label>
        <div className="flex items-center gap-2 pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100/90 text-slate-800 transition-all cursor-pointer border border-slate-200/90 shadow-2xs">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs ring-2 ring-primary/20"
            style={{ backgroundColor: currentTenant.colors?.primary || '#2563EB' }}
          />
          <span className="truncate max-w-[125px] font-bold">
            {presetLabels[currentTenant.id] || currentTenant.name}
          </span>
        </div>
        <select
          id="tenant-select"
          data-testid="tenant-select"
          value={currentTenant.id}
          onChange={handleSelectChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer max-w-[112px] truncate"
        >
          <option value="corporate">Korporat Swasta</option>
          <option value="pemerintah">Instansi Pemerintah</option>
          <option value="sekolah">Institusi Pendidikan</option>
          <option value="retail">Bisnis Retail & F&B</option>
        </select>
        <ChevronDown
          className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 z-10"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default TenantSwitcher;
