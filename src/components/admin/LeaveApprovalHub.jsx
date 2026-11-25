import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getLeaves, updateLeave } from '../../utils/storage.js';
import { Badge } from '../common/Badge.jsx';
import { Modal } from '../common/Modal.jsx';

export function LeaveApprovalHub({
  onProcessed,
  'data-testid': testId = 'leave-approval-hub',
  className = '',
}) {
  const { currentUser } = useAuth();
  const reviewerName = currentUser?.name || 'Admin HR';

  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject'
  const [hrNotes, setHrNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const refreshLeaves = () => {
    const all = getLeaves();
    setLeaves(all);
  };

  useEffect(() => {
    refreshLeaves();
  }, []);

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  const handleOpenReview = (leaveItem, defaultAction = 'approve') => {
    setSelectedLeave(leaveItem);
    setActionType(defaultAction);
    setHrNotes('');
    setErrorMessage('');
  };

  const handleProcessAction = () => {
    setErrorMessage('');
    if (!selectedLeave) return;

    if (actionType === 'reject' && (!hrNotes || !hrNotes.trim())) {
      setErrorMessage('Harap cantumkan alasan/catatan penolakan');
      return;
    }

    const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
    updateLeave(selectedLeave.id, {
      status: newStatus,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      reviewNotes: hrNotes.trim() || (actionType === 'approve' ? 'Disetujui oleh HR' : 'Ditolak'),
    });

    setSelectedLeave(null);
    refreshLeaves();
    if (onProcessed) onProcessed();
  };

  return (
    <div data-testid={testId} className={`leave-approval-hub space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Leave Approval Hub
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pusat tinjauan & persetujuan perizinan karyawan
          </p>
        </div>
        <div
          data-testid="pending-count-badge"
          className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
        >
          {pendingLeaves.length} Menunggu
        </div>
      </div>

      {pendingLeaves.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-slate-400 text-xs">
          Tidak ada pengajuan cuti yang memerlukan persetujuan saat ini.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingLeaves.map((lve) => (
            <div
              key={lve.id}
              data-testid={`approval-item-${lve.id}`}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1 min-w-0 w-full sm:w-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-white">{lve.userName}</span>
                  <span className="text-xs text-sky-400 font-mono">({lve.userNik})</span>
                  <Badge variant="warning">{lve.typeLabel || lve.type?.toUpperCase()}</Badge>
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-400">Rentang: </span>
                  {lve.startDate} s/d {lve.endDate} ({lve.durationDays} Hari)
                </div>
                {lve.attachmentName && (
                  <div className="text-[11px] text-sky-400 flex flex-wrap items-center gap-1 font-mono min-w-0 max-w-full">
                    <span className="shrink-0">📎 Lampiran:</span>
                    <span className="min-w-0 flex-1 truncate break-all max-w-full">{lve.attachmentName}</span>
                  </div>
                )}
                <p className="text-xs text-slate-400 italic">
                  "{lve.reason}"
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  data-testid={`btn-review-${lve.id}`}
                  onClick={() => handleOpenReview(lve, 'approve')}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Review
                </button>
                <button
                  type="button"
                  data-testid={`btn-approve-${lve.id}`}
                  onClick={() => handleOpenReview(lve, 'approve')}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  Setujui
                </button>
                <button
                  type="button"
                  data-testid={`btn-reject-${lve.id}`}
                  onClick={() => handleOpenReview(lve, 'reject')}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white shadow-sm"
                >
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review & Action Modal */}
      <Modal
        isOpen={Boolean(selectedLeave)}
        onClose={() => setSelectedLeave(null)}
        title={actionType === 'approve' ? 'Persetujuan Pengajuan Cuti' : 'Penolakan Pengajuan Cuti'}
        data-testid="approval-modal"
      >
        {selectedLeave && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-800/60 text-xs space-y-1">
              <div><span className="text-slate-400">Pemohon: </span><span className="font-bold text-white">{selectedLeave.userName} ({selectedLeave.userNik})</span></div>
              <div><span className="text-slate-400">Tipe: </span><span className="text-sky-300 font-semibold">{selectedLeave.typeLabel || selectedLeave.type}</span></div>
              <div><span className="text-slate-400">Durasi: </span><span className="text-white">{selectedLeave.startDate} s/d {selectedLeave.endDate} ({selectedLeave.durationDays} Hari)</span></div>
              {selectedLeave.attachmentName && (
                <div className="min-w-0 break-all">
                  <span className="text-slate-400">Lampiran: </span>
                  <span className="text-sky-300 font-mono break-all">📎 {selectedLeave.attachmentName}</span>
                </div>
              )}
              <div><span className="text-slate-400">Alasan: </span><span className="text-slate-200 italic">"{selectedLeave.reason}"</span></div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                data-testid="approval-error-msg"
                className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="hr-notes-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan Reviewer HR {actionType === 'reject' && <span className="text-rose-400">*</span>}
              </label>
              <textarea
                id="hr-notes-input"
                data-testid="hr-notes-input"
                rows={3}
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Tuliskan catatan persetujuan (opsional)...'
                    : 'Tuliskan alasan penolakan secara spesifik...'
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Batal
              </button>
              {actionType === 'approve' ? (
                <button
                  type="button"
                  data-testid="btn-confirm-approve"
                  onClick={handleProcessAction}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-glow"
                >
                  Setujui Permohonan
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="btn-confirm-reject"
                  onClick={handleProcessAction}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-glow"
                >
                  Tolak Permohonan
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default LeaveApprovalHub;
