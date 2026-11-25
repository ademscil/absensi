import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTenant } from '../../context/TenantContext.jsx';
import { addLeave, getLeaves, getUsers } from '../../utils/storage.js';

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

export function LeaveRequestForm({
  onSubmitted,
  'data-testid': testId = 'leave-request-form',
  className = '',
}) {
  const { currentUser } = useAuth();
  const { labels } = useTenant();

  const [leaveType, setLeaveType] = useState('cuti');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get up-to-date user leave quota
  const allUsers = getUsers();
  const freshUser = allUsers.find((u) => u.nik === currentUser?.nik || u.id === currentUser?.id) || currentUser;
  const remainingQuota = freshUser?.annualLeaveRemaining ?? 12;

  // Calculate duration excluding weekends if applicable
  const calculateDuration = () => {
    if (!startDate || !endDate) return { days: 0, weekendOnly: false, invalidRange: false };
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    if (!start || !end) return { days: 0, weekendOnly: false, invalidRange: false };

    if (end < start) {
      return { days: 0, weekendOnly: false, invalidRange: true };
    }

    let workDays = 0;
    let totalDays = 0;
    const cur = new Date(start);
    while (cur <= end) {
      totalDays++;
      const dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (totalDays > 0 && workDays === 0) {
      return { days: 0, weekendOnly: true, invalidRange: false };
    }

    return { days: workDays, weekendOnly: false, invalidRange: false };
  };

  const { days: calculatedDuration, weekendOnly, invalidRange } = calculateDuration();

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (invalidRange) {
      setErrorMessage('Tanggal selesai tidak boleh lebih awal dari tanggal mulai');
      return;
    }

    if (weekendOnly) {
      setErrorMessage('Rentang tanggal hanya memuat hari libur akhir pekan');
      return;
    }

    if (calculatedDuration === 0) {
      setErrorMessage('Pilih rentang tanggal yang valid');
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setErrorMessage('Alasan cuti wajib diisi minimal 5 karakter');
      return;
    }

    if (leaveType === 'cuti' && calculatedDuration > remainingQuota) {
      setErrorMessage(`Sisa cuti tidak mencukupi (Tersisa: ${remainingQuota} hari, Diajukan: ${calculatedDuration} hari)`);
      return;
    }

    // Check overlapping leave requests
    const existingLeaves = getLeaves();
    const userLeaves = existingLeaves.filter(
      (l) => (l.userNik === currentUser?.nik || l.userId === currentUser?.id) && l.status !== 'rejected'
    );

    const newStart = parseLocalDate(startDate);
    const newEnd = parseLocalDate(endDate);

    const hasOverlap = userLeaves.some((l) => {
      const existStart = parseLocalDate(l.startDate);
      const existEnd = parseLocalDate(l.endDate);
      return existStart && existEnd && newStart <= existEnd && newEnd >= existStart;
    });

    if (hasOverlap) {
      setErrorMessage('Anda sudah memiliki pengajuan cuti pada rentang tanggal tersebut');
      return;
    }

    // Submit leave request
    const newRecord = addLeave({
      userId: currentUser?.id || 'usr_demo',
      userName: currentUser?.name || 'Karyawan Demo',
      userNik: currentUser?.nik || '2024001',
      tenantId: currentUser?.tenantId || 'corporate',
      department: currentUser?.department || 'Operasional',
      type: leaveType,
      typeLabel: leaveType === 'cuti' ? 'Cuti Tahunan' : leaveType === 'izin' ? 'Izin Keperluan Pribadi' : 'Sakit',
      startDate,
      endDate,
      durationDays: calculatedDuration,
      reason: reason.trim(),
      attachmentName: attachmentName ? attachmentName : undefined,
      status: 'pending',
    });

    setSuccessMessage('Pengajuan cuti berhasil dikirim dan menunggu persetujuan HR');
    setStartDate('');
    setEndDate('');
    setReason('');
    setAttachmentName('');

    if (onSubmitted) onSubmitted(newRecord);
  };

  const isExceedingQuota = leaveType === 'cuti' && calculatedDuration > remainingQuota;
  const isSubmitDisabled = invalidRange || weekendOnly || isExceedingQuota;

  return (
    <form
      data-testid={testId}
      onSubmit={handleSubmit}
      className={`leave-request-form space-y-4 p-5 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Pengajuan Perizinan & Cuti
        </h3>
        <span data-testid="leave-quota-badge" className="text-xs font-semibold text-sky-400">
          Sisa Cuti: {remainingQuota} Hari
        </span>
      </div>

      {errorMessage && (
        <div
          role="alert"
          data-testid="leave-form-error"
          className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          data-testid="leave-form-success"
          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
        >
          {successMessage}
        </div>
      )}

      {/* Leave Type */}
      <div>
        <label htmlFor="leave-type-select" className="block text-xs font-semibold text-slate-300 mb-1">
          Tipe Pengajuan
        </label>
        <select
          id="leave-type-select"
          data-testid="leave-type-select"
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
        >
          <option value="cuti">Cuti Tahunan</option>
          <option value="izin">Izin Urusan Pribadi</option>
          <option value="sakit">Sakit (Keterangan Dokter)</option>
        </select>
      </div>

      {/* Date Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="leave-start-date" className="block text-xs font-semibold text-slate-300 mb-1">
            Tanggal Mulai
          </label>
          <input
            id="leave-start-date"
            type="date"
            data-testid="leave-start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>
        <div>
          <label htmlFor="leave-end-date" className="block text-xs font-semibold text-slate-300 mb-1">
            Tanggal Selesai
          </label>
          <input
            id="leave-end-date"
            type="date"
            data-testid="leave-end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>
      </div>

      {/* Duration Display */}
      <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-800/60">
        <span className="text-slate-400">Total Durasi Kerja:</span>
        <span data-testid="calculated-duration" className="font-bold text-white">
          {calculatedDuration} Hari
        </span>
      </div>

      {/* Warning on exceeding quota or invalid range */}
      {invalidRange && (
        <p className="text-xs text-rose-400">
          Tanggal selesai tidak boleh lebih awal dari tanggal mulai
        </p>
      )}
      {weekendOnly && (
        <p className="text-xs text-amber-400">
          Rentang tanggal hanya memuat hari libur akhir pekan
        </p>
      )}
      {isExceedingQuota && (
        <p className="text-xs text-rose-400">
          Sisa cuti tidak mencukupi (Tersisa: {remainingQuota} hari, Diajukan: {calculatedDuration} hari)
        </p>
      )}

      {/* Simulated Document Attachment */}
      <div>
        <label htmlFor="leave-attachment" className="block text-xs font-semibold text-slate-300 mb-1">
          Lampiran Dokumen / Surat Keterangan (Opsional)
        </label>
        <input
          id="leave-attachment"
          type="file"
          data-testid="leave-attachment-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setAttachmentName(file ? file.name : '');
          }}
          className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-sky-400 hover:file:bg-slate-700 cursor-pointer"
        />
        {attachmentName && (
          <div
            data-testid="leave-attachment-preview"
            className="mt-1.5 inline-flex max-w-full min-w-0 items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-300 text-xs font-mono"
          >
            <span className="shrink-0">📎</span>
            <span className="min-w-0 flex-1 truncate max-w-[160px] sm:max-w-[200px]">{attachmentName}</span>
            <button
              type="button"
              onClick={() => setAttachmentName('')}
              className="text-slate-400 hover:text-rose-400 ml-1 text-xs cursor-pointer shrink-0"
              title="Hapus lampiran"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="leave-reason" className="block text-xs font-semibold text-slate-300 mb-1">
          Alasan {labels.userLabel}
        </label>
        <textarea
          id="leave-reason"
          data-testid="leave-reason-input"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Tuliskan keterangan lengkap pengajuan (minimal 5 karakter)..."
          className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitDisabled}
        data-testid="btn-submit-leave"
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-glow ${
          isSubmitDisabled
            ? 'bg-slate-700 opacity-50 cursor-not-allowed'
            : 'bg-primary hover:brightness-110 active:scale-[0.98]'
        }`}
      >
        Kirim Pengajuan
      </button>
    </form>
  );
}
export default LeaveRequestForm;
