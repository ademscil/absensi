import React, { useState, useEffect } from 'react';
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
    <div data-testid={testId} className={`attendance-history space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white tracking-wide">Riwayat Kehadiran</h3>
        <span className="text-xs text-slate-400">Total: {filteredRecords.length} Presensi</span>
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
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
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
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
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
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
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
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Pulang
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <span className="text-3xl">📅</span>
          <p className="text-xs text-slate-400 mt-2">Belum ada riwayat kehadiran tercatat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((rec) => {
            const hasError = imageErrorMap[rec.id];
            return (
              <div
                key={rec.id}
                data-testid={`history-card-${rec.id}`}
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
              >
                {/* Photo Thumbnail */}
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 cursor-pointer flex items-center justify-center"
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
                    <div data-testid="photo-placeholder-avatar" className="text-lg">
                      👤
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{rec.date}</span>
                    <span className="text-[11px] text-sky-400 font-mono">{rec.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {rec.coordinates?.address || 'Lokasi Terverifikasi'}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <Badge>{rec.status}</Badge>
                  <span className="text-[10px] text-slate-500 uppercase">{rec.type}</span>
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
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-700 flex items-center justify-center">
              {selectedRecord.photoDataUrl && !imageErrorMap[selectedRecord.id] ? (
                <img
                  src={selectedRecord.photoDataUrl}
                  alt="Zoomed Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl text-slate-500">👤</div>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Nama:</span>
                <span className="font-bold text-white">{selectedRecord.userName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">NIK / ID:</span>
                <span className="font-mono text-white">{selectedRecord.userNik}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Waktu & Tanggal:</span>
                <span className="text-white">{selectedRecord.date} {selectedRecord.time} WIB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-400">{selectedRecord.status} ({selectedRecord.type})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Koordinat GPS:</span>
                <span className="font-mono text-sky-400">
                  {selectedRecord.coordinates?.lat || 0}, {selectedRecord.coordinates?.lng || 0}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Auth Hash:</span>
                <span className="font-mono text-emerald-400">#{selectedRecord.authHash}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default AttendanceHistory;
