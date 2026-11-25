import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * BottomNav - Mobile-first floating bottom navigation bar
 * Features:
 * - Active state glow and tactile spring feedback
 * - Smooth tab switching with role-specific tab items
 * - Mobile-first responsive visibility (hidden on md+ screens)
 */
export function BottomNav({
  activeTab = 'presensi',
  onTabChange,
  'data-testid': testId = 'bottom-nav',
  className = '',
}) {
  const { role } = useAuth();

  const karyawanTabs = [
    { id: 'presensi', label: 'Presensi', icon: '📷' },
    { id: 'riwayat', label: 'Riwayat', icon: '📅' },
    { id: 'pengajuan', label: 'Cuti / Izin', icon: '📝' },
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'approval', label: 'Approval Hub', icon: '✅' },
    { id: 'rekap', label: 'Rekapitulasi', icon: '📑' },
  ];

  const tabs = role === 'admin' ? adminTabs : karyawanTabs;

  return (
    <nav
      data-testid={testId}
      className={`bottom-nav fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 border-t border-slate-200/90 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-lg transition-all ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            data-testid={`tab-${tab.id}`}
            onClick={() => onTabChange && onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
              isActive
                ? 'text-primary font-bold bg-blue-50/80 shadow-xs scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 active:scale-95'
            }`}
          >
            <span className="text-lg leading-none mb-1 transition-transform duration-200">
              {tab.icon}
            </span>
            <span className="text-[11px] truncate">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
