import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Search, Bell, Building2 } from 'lucide-react';
import { useTenant } from '../../context/TenantContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { TenantSwitcher } from '../common/TenantSwitcher.jsx';
import { Badge } from '../common/Badge.jsx';

/**
 * Header - Top navigation bar completely overhauled to enterprise SaaS standards (TailAdmin & Horizon UI)
 * Features:
 * - Top brand gradient accent line
 * - Brand logo & organization breadcrumb
 * - Center global command search bar (⌘K)
 * - Live Indonesian clock with WIB formatting
 * - Modern single-pill tenant switcher
 * - User profile capsule with avatar, role badge, and quick logout
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
      className={`app-header sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-colors ${className}`}
    >
      {/* Top Brand Gradient Accent Bar */}
      <div className="h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 w-full" />

      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand Identity with Organization Context */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            data-testid="brand-logo"
            className="w-9 h-9 max-w-full max-h-full object-contain overflow-hidden rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/10 border border-slate-200/90 bg-white p-1 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: currentTenant.logoSvg }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight truncate max-w-xs sm:max-w-md">
                {currentTenant.name}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                <Building2 className="w-2.5 h-2.5" />
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate hidden md:block">
              {currentTenant.tagline}
            </p>
          </div>
        </div>

        {/* Center: Command Search Bar (TailAdmin & Horizon UI Signature) */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 text-slate-400 text-xs w-72 transition-all shadow-2xs cursor-pointer group">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          <span className="flex-1 text-slate-400 group-hover:text-slate-600 text-[11px] truncate">
            Cari data, NIK, atau riwayat...
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-semibold text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Right Controls: Clock, Switcher, Notification, User Profile, Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Indonesian Digital Clock */}
          <div
            data-testid="digital-clock"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>{wibTime}</span>
          </div>

          {/* Tenant Preset Switcher */}
          <TenantSwitcher />

          {/* Notification Bell Icon */}
          <button
            type="button"
            title="Notifikasi Sistem"
            className="hidden sm:flex relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {/* Authenticated User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="flex items-center gap-2.5 p-1 rounded-xl">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="text-left hidden sm:block">
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

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                data-testid="btn-logout"
                title="Keluar dari Sistem"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150 cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
