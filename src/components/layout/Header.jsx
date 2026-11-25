import React, { useState, useEffect } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useTenant } from '../../context/TenantContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { TenantSwitcher } from '../common/TenantSwitcher.jsx';

/**
 * Header - Top navigation bar redesigned following Horizon UI & TailAdmin design standards
 * Features:
 * - Clean contextual breadcrumb header
 * - Unified signature floating capsule control bar on the right
 * - Integrated live Indonesian clock, tenant preset switcher, user avatar, and quick logout
 * - Zero border soup and cohesive elevation
 */
export function Header({
  'data-testid': testId = 'app-header',
  className = '',
}) {
  const { currentTenant } = useTenant();
  const { currentUser, logout, role } = useAuth();
  const [wibTime, setWibTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      setWibTime(`${hours}:${minutes}:${seconds} WIB`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'US';

  return (
    <header
      data-testid={testId}
      className={`app-header sticky top-0 z-40 w-full h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between gap-4 transition-all ${className}`}
    >
      {/* Left: Brand Identity & Context Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          data-testid="brand-logo"
          className="w-9 h-9 max-w-full max-h-full object-contain overflow-hidden rounded-xl flex items-center justify-center shrink-0 shadow-2xs border border-slate-200/80 bg-white p-1 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
          dangerouslySetInnerHTML={{ __html: currentTenant.logoSvg }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-xs sm:max-w-sm">
              {currentTenant.name}
            </h1>
            <span className="hidden sm:inline-flex text-slate-300">/</span>
            <span className="hidden sm:inline-flex items-center text-xs font-medium text-slate-500">
              {role === 'admin' ? 'HR Portal' : 'Presensi'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-normal truncate hidden md:block">
            {currentTenant.tagline}
          </p>
        </div>
      </div>

      {/* Right: Horizon UI Signature Floating Capsule Control Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-full bg-slate-50 border border-slate-200/80 shadow-2xs">
        {/* Indonesian Live Clock */}
        <div
          data-testid="digital-clock"
          className="hidden md:flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium text-slate-600 border-r border-slate-200/80"
        >
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>{wibTime}</span>
        </div>

        {/* Tenant Preset Switcher */}
        <TenantSwitcher />

        {/* User Session Profile & Actions */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200/80">
            {/* Avatar & User Details */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-white shadow-2xs">
                {initials}
              </div>
              <div className="text-left hidden lg:block pr-1">
                <div className="text-xs font-bold text-slate-800 truncate max-w-[110px] leading-tight">
                  {currentUser.name}
                </div>
                <span
                  data-testid="role-badge"
                  className="text-[10px] font-medium text-slate-400"
                >
                  {role === 'admin' ? 'Admin HR' : 'Karyawan'}
                </span>
              </div>
            </div>

            {/* Subtle Logout Action */}
            <button
              type="button"
              onClick={logout}
              data-testid="btn-logout"
              title="Keluar dari Sistem"
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
