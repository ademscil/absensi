import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, Clock, CalendarOff } from 'lucide-react';
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
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total {labels.userLabel}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {kpis.totalUsers}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 font-medium">Terdaftar aktif</span>
        </div>

        <div
          data-testid="kpi-ontime"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hadir Tepat Waktu</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {kpis.onTime}
          </span>
          <span className="text-[11px] text-emerald-600/80 mt-1 font-medium">Presensi valid</span>
        </div>

        <div
          data-testid="kpi-late"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Terlambat</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">
            {kpis.late}
          </span>
          <span className="text-[11px] text-rose-600/80 mt-1 font-medium">&gt; 08:00 WIB</span>
        </div>

        <div
          data-testid="kpi-leave"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuti / Izin</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarOff className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {kpis.onLeave}
          </span>
          <span className="text-[11px] text-amber-600/80 mt-1 font-medium">Disetujui HR</span>
        </div>
      </div>

      {/* Live Stream Feed */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Live Attendance Stream
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
            Real-time Feed
          </span>
        </div>

        <div data-testid="live-attendance-feed" className="space-y-2.5">
          {liveFeed.map((item) => (
            <div
              key={item.id}
              data-testid={`feed-item-${item.id}`}
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-xs flex items-center justify-between gap-2 sm:gap-3 text-xs transition-all min-w-0"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-xs">
                  {item.photoDataUrl ? (
                    <img src={item.photoDataUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400">👤</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-bold text-slate-900 truncate min-w-0 max-w-full">{item.userName}</span>
                    {item.isSimulator && (
                      <span
                        data-testid="simulator-warning-badge"
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0"
                      >
                        [SIMULATOR]
                      </span>
                    )}
                  </div>
                  <span className="block truncate text-[11px] text-slate-500 font-mono mt-0.5">
                    {item.userNik} • {item.department}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <Badge>{item.status}</Badge>
                <div className="text-[10px] text-slate-500 font-mono font-medium mt-1">
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
