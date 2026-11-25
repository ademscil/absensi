import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTenant } from '../../context/TenantContext.jsx';
import { Badge } from '../common/Badge.jsx';

/**
 * Sidebar - Desktop navigation sidebar
 * Features:
 * - Responsive desktop visibility (hidden on mobile, flex on md+)
 * - Dynamic tab links responding to active user role (Karyawan vs Admin HR)
 * - Active state glow and visual highlights
 * - Active tenant labels and profile card
 */
export function Sidebar({
  activeTab = 'presensi',
  onTabChange,
  'data-testid': testId = 'desktop-sidebar',
  className = '',
}) {
  const { role, currentUser } = useAuth();
  const { labels } = useTenant();

  const karyawanItems = [
    { id: 'presensi', label: 'Presensi Kamera', icon: '📷' },
    { id: 'riwayat', label: 'Riwayat Kehadiran', icon: '📅' },
    { id: 'pengajuan', label: 'Pengajuan Cuti & Izin', icon: '📝' },
  ];

  const adminItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: '📊' },
    { id: 'approval', label: 'Approval Hub', icon: '✅' },
    { id: 'rekap', label: 'Rekapitulasi & Ekspor', icon: '📑' },
  ];

  const items = role === 'admin' ? adminItems : karyawanItems;

  return (
    <aside
      data-testid={testId}
      className={`desktop-sidebar hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-4 shrink-0 transition-all ${className}`}
    >
      {/* Current User Profile Card */}
      <div className="mb-6 px-3.5 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {labels.userLabel} Aktif
          </span>
          <Badge
            variant={role === 'admin' ? 'purple' : 'primary'}
            className="text-[9px] px-1.5 py-0"
          >
            {role === 'admin' ? 'Admin' : 'Staff'}
          </Badge>
        </div>
        <div className="text-sm font-bold text-white truncate">
          {currentUser?.name || 'User'}
        </div>
        <div className="text-xs text-sky-400 truncate mt-0.5">
          {labels.idLabel}: {currentUser?.nik || '-'}
        </div>
        <div className="text-[11px] text-slate-400 truncate mt-0.5">
          {currentUser?.department || '-'}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`sidebar-link-${item.id}`}
              onClick={() => onTabChange && onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-glow scale-[1.01]'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
