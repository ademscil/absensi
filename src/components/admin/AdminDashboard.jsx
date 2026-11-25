import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.jsx';
import { getUsers, getAttendances, getLeaves } from '../../utils/storage.js';
import { Badge } from '../common/Badge.jsx';

export function AdminDashboard({
  'data-testid': testId = 'admin-dashboard',
  className = '',
}) {
  const { labels } = useTenant();
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    onTime: 0,
    late: 0,
    onLeave: 0,
  });
  const [liveFeed, setLiveFeed] = useState([]);

  useEffect(() => {
    const users = getUsers();
    const attendances = getAttendances();
    const leaves = getLeaves();

    const employees = users.filter((u) => u.role === 'karyawan');
    const totalUsers = employees.length > 0 ? employees.length : users.length;

    // Filter today's attendances or recent
    let onTimeCount = 0;
    let lateCount = 0;
    attendances.forEach((a) => {
      if (a.status === 'Tepat Waktu' || a.status === 'Hadir') onTimeCount++;
      else if (a.status === 'Terlambat') lateCount++;
    });

    const activeLeavesCount = leaves.filter((l) => l.status === 'approved').length;

    setKpis({
      totalUsers: totalUsers,
      onTime: onTimeCount,
      late: lateCount,
      onLeave: activeLeavesCount,
    });

    setLiveFeed(attendances.slice(0, 8));
  }, []);

  return (
    <div data-testid={testId} className={`admin-dashboard space-y-6 ${className}`}>
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          data-testid="kpi-total-employees"
          className="p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
        >
          <span className="text-xs font-semibold text-slate-400">Total {labels.userLabel}</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {kpis.totalUsers}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Terdaftar aktif</span>
        </div>

        <div
          data-testid="kpi-ontime"
          className="p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
        >
          <span className="text-xs font-semibold text-slate-400">Hadir Tepat Waktu</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
            {kpis.onTime}
          </span>
          <span className="text-[10px] text-emerald-500/70 mt-1">Presensi valid</span>
        </div>

        <div
          data-testid="kpi-late"
          className="p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
        >
          <span className="text-xs font-semibold text-slate-400">Terlambat</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">
            {kpis.late}
          </span>
          <span className="text-[10px] text-rose-500/70 mt-1">&gt; 08:00 WIB</span>
        </div>

        <div
          data-testid="kpi-leave"
          className="p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
        >
          <span className="text-xs font-semibold text-slate-400">Cuti / Izin</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">
            {kpis.onLeave}
          </span>
          <span className="text-[10px] text-amber-500/70 mt-1">Disetujui HR</span>
        </div>
      </div>

      {/* Live Stream Feed */}
      <div className="p-5 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Live Attendance Stream
            </h3>
          </div>
          <span className="text-xs text-slate-400">Real-time Feed</span>
        </div>

        <div data-testid="live-attendance-feed" className="space-y-2.5">
          {liveFeed.map((item) => (
            <div
              key={item.id}
              data-testid={`feed-item-${item.id}`}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600 flex items-center justify-between gap-2 sm:gap-3 text-xs transition-all min-w-0"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                  {item.photoDataUrl ? (
                    <img src={item.photoDataUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-bold text-white truncate min-w-0 max-w-full">{item.userName}</span>
                    {item.isSimulator && (
                      <span
                        data-testid="simulator-warning-badge"
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0"
                      >
                        [SIMULATOR]
                      </span>
                    )}
                  </div>
                  <span className="block truncate text-[11px] text-slate-400 font-mono">
                    {item.userNik} • {item.department}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <Badge>{item.status}</Badge>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {item.time} WIB
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default AdminDashboard;
