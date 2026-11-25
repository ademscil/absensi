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
    <div data-testid={testId} className={`leave-status-list space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Status Pengajuan Anda
        </h4>
        <span className="text-[11px] text-slate-400">{leaves.length} Riwayat</span>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 text-xs">
          Belum ada pengajuan cuti atau izin.
        </div>
      ) : (
        <div className="space-y-2.5">
          {leaves.map((lve) => (
            <div
              key={lve.id}
              data-testid={`leave-card-${lve.id}`}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 space-y-1.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
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

              <div className="text-[11px] text-slate-400">
                {lve.startDate} s/d {lve.endDate} ({lve.durationDays} Hari)
              </div>

              {lve.attachmentName && (
                <div
                  data-testid={`attachment-badge-${lve.id}`}
                  className="text-[11px] text-sky-400 flex flex-wrap items-center gap-1 font-mono min-w-0 max-w-full"
                >
                  <span className="shrink-0">📎</span>
                  <span className="min-w-0 flex-1 truncate break-all max-w-full">{lve.attachmentName}</span>
                </div>
              )}

              <div className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg">
                <span className="text-slate-400 font-semibold">Alasan: </span>
                {lve.reason}
              </div>

              {lve.reviewNotes && (
                <div
                  data-testid="hr-review-notes"
                  className="text-xs text-sky-300 bg-sky-950/40 border border-sky-800/40 p-2 rounded-lg"
                >
                  <span className="font-semibold">Catatan HR ({lve.reviewedBy || 'Admin'}): </span>
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
