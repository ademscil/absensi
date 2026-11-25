import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getLeaves } from '../../utils/storage.js';
import { Badge } from '../common/Badge.jsx';

export function LeaveStatusList({
  refreshKey = 0,
  'data-testid': testId = 'leave-status-list',
  className = '',
}) {
  const { currentUser } = useAuth();
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const all = getLeaves();
    if (currentUser?.nik) {
      const userLeaves = all.filter(
        (l) => l.userNik === currentUser.nik || l.userId === currentUser.id
      );
      setLeaves(userLeaves.length > 0 ? userLeaves : all);
    } else {
      setLeaves(all);
    }
  }, [currentUser, refreshKey]);

  return (
    <div
      data-testid={testId}
      className={`leave-status-list bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 text-slate-800 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Status Pengajuan Anda
        </h4>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
          {leaves.length} Riwayat
        </span>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
          Belum ada pengajuan cuti atau izin.
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((lve) => (
            <div
              key={lve.id}
              data-testid={`leave-card-${lve.id}`}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-xs space-y-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {lve.typeLabel || lve.type?.toUpperCase()}
                </span>
                <Badge>
                  {lve.status === 'approved'
                    ? 'Disetujui'
                    : lve.status === 'rejected'
                    ? 'Ditolak'
                    : 'Menunggu Persetujuan'}
                </Badge>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                {lve.startDate} s/d {lve.endDate} ({lve.durationDays} Hari Kerja)
              </div>

              {lve.attachmentName && (
                <div
                  data-testid={`attachment-badge-${lve.id}`}
                  className="text-[11px] text-primary flex flex-wrap items-center gap-1 font-mono min-w-0 max-w-full"
                >
                  <span className="shrink-0">📎</span>
                  <span className="min-w-0 flex-1 truncate break-all max-w-full font-medium">{lve.attachmentName}</span>
                </div>
              )}

              <div className="text-xs text-slate-700 bg-white border border-slate-200/80 p-2.5 rounded-xl shadow-xs">
                <span className="text-slate-400 font-semibold">Alasan: </span>
                {lve.reason}
              </div>

              {lve.reviewNotes && (
                <div
                  data-testid="hr-review-notes"
                  className="text-xs text-blue-900 bg-blue-50 border border-blue-200/80 p-2.5 rounded-xl"
                >
                  <span className="font-bold">Catatan HR ({lve.reviewedBy || 'Admin'}): </span>
                  {lve.reviewNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default LeaveStatusList;
