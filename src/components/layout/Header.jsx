import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { TenantSwitcher } from '../common/TenantSwitcher.jsx';
import { Badge } from '../common/Badge.jsx';

/**
 * Header - Top navigation bar
 * Features:
 * - Live Indonesian clock (HH:mm:ss WIB) with clean timer unmount cleanup
 * - Active tenant logo & brand name
 * - Role status badge (Admin HR / Karyawan)
 * - Tenant switcher integration
 * - User session and logout trigger
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

  return (
    <header
      data-testid={testId}
      className={`app-header sticky top-0 z-40 w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200/90 bg-white/95 backdrop-blur-md flex items-center justify-between gap-2 shadow-sm ${className}`}
    >
      {/* Brand & Tenant Identity */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div
          data-testid="brand-logo"
          className="w-9 h-9 max-w-full max-h-full object-contain overflow-hidden rounded-xl flex items-center justify-center shrink-0 shadow-sm [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
          dangerouslySetInnerHTML={{ __html: currentTenant.logoSvg }}
        />
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide truncate max-w-[96px] sm:max-w-xs">
            {currentTenant.name}
          </h1>
          <p className="text-[11px] text-slate-500 truncate hidden sm:block">
            {currentTenant.tagline}
          </p>
        </div>
      </div>

      {/* Right Controls: Clock, TenantSwitcher, Role Badge & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Live Indonesian Clock */}
        <div
          data-testid="digital-clock"
          className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hidden md:block"
        >
          {wibTime}
        </div>

        {/* Tenant Switcher */}
        <TenantSwitcher />

        {/* Authenticated User Controls */}
        {currentUser && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {currentUser.name}
              </div>
              <Badge
                data-testid="role-badge"
                variant={role === 'admin' ? 'purple' : 'primary'}
                className="text-[10px] px-2 py-0 mt-0.5"
              >
                {role === 'admin' ? 'Admin HR' : 'Karyawan'}
              </Badge>
            </div>

            <button
              type="button"
              onClick={logout}
              data-testid="btn-logout"
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
