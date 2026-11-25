import React, { useState, useEffect } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useTenant } from '../../context/TenantContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { TenantSwitcher } from '../common/TenantSwitcher.jsx';
import { Badge } from '../common/Badge.jsx';

/**
 * Header - Top navigation bar redesigned with modern enterprise SaaS styling
 * Features:
 * - Clean brand logo & title with Enterprise pill tag
 * - Live Indonesian clock (HH:mm:ss WIB) with clean unmount timer cleanup
 * - Segmented unified Tenant Switcher control
 * - Sleek user profile initials avatar and refined subtle logout action
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

  // Generate initials for header avatar
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
      className={`app-header sticky top-0 z-40 w-full px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/90 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xs ${className}`}
    >
      {/* Brand & Tenant Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        <div
          data-testid="brand-logo"
          className="w-9 h-9 max-w-full max-h-full object-contain overflow-hidden rounded-xl flex items-center justify-center shrink-0 shadow-2xs border border-slate-200/90 bg-white p-1 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
          dangerouslySetInnerHTML={{ __html: currentTenant.logoSvg }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate max-w-[96px] sm:max-w-xs">
              {currentTenant.name}
            </h1>
            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
              Enterprise
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate hidden sm:block">
            {currentTenant.tagline}
          </p>
        </div>
      </div>

      {/* Right Controls: Clock, TenantSwitcher, User Avatar & Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Indonesian Clock */}
        <div
          data-testid="digital-clock"
          className="px-3 py-1.5 text-xs font-mono font-semibold rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hidden md:flex items-center gap-1.5 shadow-2xs"
        >
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>{wibTime}</span>
        </div>

        {/* Unified Tenant Switcher */}
        <TenantSwitcher />

        {/* Authenticated User Profile & Action */}
        {currentUser && (
          <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
            {/* User Profile Info with Initials Avatar */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {initials}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[120px] leading-tight">
                  {currentUser.name}
                </div>
                <Badge
                  data-testid="role-badge"
                  variant={role === 'admin' ? 'purple' : 'primary'}
                  className="text-[9px] px-1.5 py-0 mt-0.5"
                >
                  {role === 'admin' ? 'Admin HR' : 'Karyawan'}
                </Badge>
              </div>
            </div>

            {/* Subtle Modern Logout Button */}
            <button
              type="button"
              onClick={logout}
              data-testid="btn-logout"
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-2xs group"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
