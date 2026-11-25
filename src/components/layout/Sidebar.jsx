import React from 'react';
import {
  Camera,
  Calendar,
  FileText,
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  Clock,
  MapPin,
  ShieldCheck,
  Users,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge } from '../common/Badge.jsx';

/**
 * Sidebar - Desktop navigation sidebar following modern SaaS dashboard templates
 * Features:
 * - Flush sticky docking to the left viewport edge
 * - Role-specific navigation tabs (Karyawan vs Admin HR) with crisp Lucide vector icons
 * - Operational info widget in the middle to eliminate empty dead space
 * - Pinned employee account card at the bottom with online status indicator
 */
export function Sidebar({
  activeTab = 'presensi',
  onTabChange,
  'data-testid': testId = 'desktop-sidebar',
  className = '',
}) {
  const { role, currentUser } = useAuth();

  const karyawanItems = [
    { id: 'presensi', label: 'Presensi Kamera', icon: Camera },
    { id: 'riwayat', label: 'Riwayat Kehadiran', icon: Calendar },
    { id: 'pengajuan', label: 'Pengajuan Cuti & Izin', icon: FileText },
  ];

  const adminItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'approval', label: 'Approval Hub', icon: UserCheck },
    { id: 'rekap', label: 'Rekapitulasi & Ekspor', icon: FileSpreadsheet },
  ];

  const items = role === 'admin' ? adminItems : karyawanItems;

  // Generate initials for profile badge
  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'US';

  return (
    <aside
      data-testid={testId}
      className={`desktop-sidebar hidden md:flex flex-col justify-between w-64 border-r border-slate-200/90 bg-white p-4 shrink-0 transition-all shadow-xs sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto ${className}`}
    >
      {/* Upper Navigation & Context Section */}
      <div className="space-y-6">
        {/* Navigation Links */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`sidebar-link-${item.id}`}
                  onClick={() => onTabChange && onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer group ${
                    isActive
                      ? 'bg-primary text-white shadow-sm shadow-primary/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Operational Context Widget */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Info Operasional
          </div>
          {role === 'admin' ? (
            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  Mode Administrator
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-white border border-purple-200 px-1.5 py-0.5 rounded-md shadow-2xs">
                  HR Ready
                </span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">Multi-Tenant Presets</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">Export Excel (.xlsx)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">Audit Trail Realtime</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Presensi Hari Ini
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded-md shadow-2xs">
                  Online
                </span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Shift: 08:00 - 17:00 WIB</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">Radius SCBD Valid</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">Watermark Anti-Fraud</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pinned Employee Account Card at Bottom */}
      <div className="mt-auto pt-4 border-t border-slate-200/80">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.name || 'User'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant={role === 'admin' ? 'purple' : 'primary'}
                  className="text-[9px] px-1.5 py-0 shrink-0"
                >
                  {role === 'admin' ? 'Admin HR' : 'Karyawan'}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {currentUser?.nik || '-'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {currentUser?.department || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
