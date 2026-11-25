import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAttendances } from '../../utils/storage.js';
import { Badge } from '../common/Badge.jsx';
import { Modal } from '../common/Modal.jsx';

export function AttendanceHistory({
  'data-testid': testId = 'attendance-history',
  className = '',
}) {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const all = getAttendances();
    if (currentUser?.nik) {
      const userRecords = all.filter(
        (r) => r.userNik === currentUser.nik || r.userId === currentUser.id
      );
      setRecords(userRecords.length > 0 ? userRecords : all);
    } else {
      setRecords(all);
    }
  }, [currentUser]);

  const handleImageError = (recordId) => {
    setImageErrorMap((prev) => ({ ...prev, [recordId]: true }));
  };

  const filteredRecords = records.filter((rec) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'ontime') return rec.status === 'Tepat Waktu' || rec.status === 'Hadir';
    if (statusFilter === 'late') return rec.status === 'Terlambat';
    if (statusFilter === 'pulang') return rec.type === 'PULANG' || rec.status === 'Pulang' || rec.status === 'PULANG';
    return true;
  });

  return (
    <div
      data-testid={testId}
      className={`attendance-history bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 text-slate-800 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Riwayat Kehadiran</h3>
          <p className="text-xs text-slate-500 mt-0.5">Daftar presensi harian dan status verifikasi foto</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
          Total: {filteredRecords.length} Presensi
        </span>
      </div>

      {/* Filter Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          data-testid="filter-status-all"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          data-testid="filter-status-ontime"
          onClick={() => setStatusFilter('ontime')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'ontime'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Tepat Waktu
        </button>
        <button
          type="button"
          data-testid="filter-status-late"
          onClick={() => setStatusFilter('late')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'late'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Terlambat
        </button>
        <button
          type="button"
          data-testid="filter-status-pulang"
          onClick={() => setStatusFilter('pulang')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'pulang'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Pulang
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-200">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-medium">Belum ada riwayat kehadiran tercatat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((rec) => {
            const hasError = imageErrorMap[rec.id];
            return (
              <div
                key={rec.id}
                data-testid={`history-card-${rec.id}`}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-sm flex items-center justify-between gap-3 transition-all"
              >
                {/* Photo Thumbnail */}
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200 cursor-pointer flex items-center justify-center shadow-xs"
                  onClick={() => setSelectedRecord(rec)}
                  data-testid="thumbnail-photo"
                >
                  {rec.photoDataUrl && !hasError ? (
                    <img
                      src={rec.photoDataUrl}
                      alt={`Foto Presensi ${rec.userName}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(rec.id)}
                    />
                  ) : (
                    <div data-testid="photo-placeholder-avatar" className="text-lg text-slate-400">
                      👤
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">{rec.date}</span>
                    <span className="text-[11px] text-primary font-mono font-semibold">{rec.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {rec.coordinates?.address || 'Lokasi Terverifikasi'}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <Badge>{rec.status}</Badge>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{rec.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Zoom Modal */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Detail Bukti Presensi"
        data-testid="photo-zoom-modal"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center shadow-inner">
              {selectedRecord.photoDataUrl && !imageErrorMap[selectedRecord.id] ? (
                <img
                  src={selectedRecord.photoDataUrl}
                  alt="Zoomed Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl text-slate-400">👤</div>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Nama Karyawan:</span>
                <span className="font-bold text-slate-900">{selectedRecord.userName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">NIK / ID:</span>
                <span className="font-mono text-primary font-semibold">{selectedRecord.userNik}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Waktu & Tanggal:</span>
                <span className="text-slate-800 font-medium">{selectedRecord.date} {selectedRecord.time} WIB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">{selectedRecord.status} ({selectedRecord.type})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Koordinat GPS:</span>
                <span className="font-mono text-slate-700">
                  {selectedRecord.coordinates?.lat || 0}, {selectedRecord.coordinates?.lng || 0}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Kode Hash Bukti:</span>
                <span className="font-mono text-emerald-600 font-semibold">#{selectedRecord.authHash}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default AttendanceHistory;
