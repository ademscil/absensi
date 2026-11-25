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
    <div
      data-testid={testId}
      className={`leave-approval-hub bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 text-slate-800 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Leave Approval Hub
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat tinjauan & persetujuan perizinan karyawan
          </p>
        </div>
        <div
          data-testid="pending-count-badge"
          className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs"
        >
          {pendingLeaves.length} Menunggu
        </div>
      </div>

      {pendingLeaves.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium">
          Tidak ada pengajuan cuti yang memerlukan persetujuan saat ini.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingLeaves.map((lve) => (
            <div
              key={lve.id}
              data-testid={`approval-item-${lve.id}`}
              className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1.5 min-w-0 w-full sm:w-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{lve.userName}</span>
                  <span className="text-xs text-primary font-mono font-semibold">({lve.userNik})</span>
                  <Badge variant="warning">{lve.typeLabel || lve.type?.toUpperCase()}</Badge>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  <span className="text-slate-400">Rentang: </span>
                  {lve.startDate} s/d {lve.endDate} ({lve.durationDays} Hari)
                </div>
                {lve.attachmentName && (
                  <div className="text-[11px] text-primary flex flex-wrap items-center gap-1 font-mono min-w-0 max-w-full">
                    <span className="shrink-0">📎 Lampiran:</span>
                    <span className="min-w-0 flex-1 truncate break-all max-w-full font-medium">{lve.attachmentName}</span>
                  </div>
                )}
                <p className="text-xs text-slate-600 bg-white border border-slate-200/80 p-2 rounded-xl italic shadow-xs">
                  "{lve.reason}"
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  data-testid={`btn-review-${lve.id}`}
                  onClick={() => handleOpenReview(lve, 'approve')}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-xs"
                >
                  Review
                </button>
                <button
                  type="button"
                  data-testid={`btn-approve-${lve.id}`}
                  onClick={() => handleOpenReview(lve, 'approve')}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-sm"
                >
                  Setujui
                </button>
                <button
                  type="button"
                  data-testid={`btn-reject-${lve.id}`}
                  onClick={() => handleOpenReview(lve, 'reject')}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-xs"
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
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
              <div><span className="text-slate-500">Pemohon: </span><span className="font-bold text-slate-900">{selectedLeave.userName} ({selectedLeave.userNik})</span></div>
              <div><span className="text-slate-500">Tipe: </span><span className="text-primary font-bold">{selectedLeave.typeLabel || selectedLeave.type}</span></div>
              <div><span className="text-slate-500">Durasi: </span><span className="text-slate-900 font-semibold">{selectedLeave.startDate} s/d {selectedLeave.endDate} ({selectedLeave.durationDays} Hari)</span></div>
              {selectedLeave.attachmentName && (
                <div className="min-w-0 break-all">
                  <span className="text-slate-500">Lampiran: </span>
                  <span className="text-primary font-mono break-all font-semibold">📎 {selectedLeave.attachmentName}</span>
                </div>
              )}
              <div><span className="text-slate-500">Alasan: </span><span className="text-slate-700 italic">"{selectedLeave.reason}"</span></div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                data-testid="approval-error-msg"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-fade-in"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="hr-notes-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Catatan Reviewer HR {actionType === 'reject' && <span className="text-rose-500">*</span>}
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              {actionType === 'approve' ? (
                <button
                  type="button"
                  data-testid="btn-confirm-approve"
                  onClick={handleProcessAction}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Setujui Permohonan
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="btn-confirm-reject"
                  onClick={handleProcessAction}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
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
