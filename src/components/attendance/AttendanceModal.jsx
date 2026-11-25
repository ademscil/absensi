import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTenant } from '../../context/TenantContext.jsx';
import { Modal } from '../common/Modal.jsx';
import { CameraWidget } from './CameraWidget.jsx';
import { stampAttendanceWatermark, generateAuthHash } from '../../utils/canvasWatermark.js';
import { saveAttendanceRecord } from '../../utils/storage.js';
import { animateCheckmark } from '../../utils/animations.js';

export function AttendanceModal({
  isOpen,
  onClose,
  type = 'MASUK',
  onSuccess,
  'data-testid': testId = 'attendance-modal',
}) {
  const { currentUser } = useAuth();
  const { currentTenant, labels } = useTenant();

  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isSimulatorUsed, setIsSimulatorUsed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [geoCoords, setGeoCoords] = useState({ lat: -6.2088, lng: 106.8456, address: 'Kantor Pusat' });
  const [punctuality, setPunctuality] = useState('Tepat Waktu');
  const [withinGeofence, setWithinGeofence] = useState(true);

  const checkmarkPathRef = useRef(null);

  // Check punctuality and geofence on open
  useEffect(() => {
    if (!isOpen) {
      setPreviewPhoto(null);
      setCelebrating(false);
      return;
    }

    const now = new Date();
    // 08:00 WIB threshold
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    if (type === 'MASUK') {
      if (hour > 8 || (hour === 8 && (minute > 0 || second > 0))) {
        setPunctuality('Terlambat');
      } else {
        setPunctuality('Tepat Waktu');
      }
    } else {
      setPunctuality('PULANG');
    }

    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGeoCoords({
            lat,
            lng,
            address: 'Jl. Jenderal Sudirman No. 1, Jakarta',
          });
          // Distance approximation to -6.2088, 106.8456
          const dist = Math.sqrt(Math.pow(lat - -6.2088, 2) + Math.pow(lng - 106.8456, 2)) * 111000;
          setWithinGeofence(dist <= 100);
        },
        () => {
          setGeoCoords({ lat: 0, lng: 0, address: 'Lokasi Tidak Terdeteksi' });
          setWithinGeofence(false);
        }
      );
    }
  }, [isOpen, type]);

  // Trigger SVG checkmark draw animation on celebration
  useEffect(() => {
    if (celebrating && checkmarkPathRef.current) {
      animateCheckmark(checkmarkPathRef.current, 650);
    }
  }, [celebrating]);

  const handleCapture = async (sourceElement, isSim) => {
    setIsSimulatorUsed(isSim);
    setProcessing(true);
    try {
      const dataUrl = await stampAttendanceWatermark(sourceElement, {
        nik: currentUser?.nik || '2024001',
        name: currentUser?.name || 'Karyawan Demo',
        idLabel: labels.idLabel,
        tenantName: currentTenant.name,
        department: currentUser?.department || 'Operasional',
        status: punctuality,
        type: type,
        coords: geoCoords,
      });
      setPreviewPhoto(dataUrl);
    } catch (err) {
      console.error('Gagal mencap watermark:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (celebrating || processing) return;
    setProcessing(true);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newRecord = saveAttendanceRecord({
      userId: currentUser?.id || 'usr_demo',
      userName: currentUser?.name || 'Karyawan Demo',
      userNik: currentUser?.nik || '2024001',
      tenantId: currentTenant.id,
      department: currentUser?.department || 'Operasional',
      date: dateStr,
      time: timeStr,
      type: type,
      status: punctuality,
      photoDataUrl: previewPhoto || '',
      coordinates: geoCoords,
      isSimulator: isSimulatorUsed,
      authHash: generateAuthHash(
        currentUser?.nik || '2024001',
        now.getTime(),
        geoCoords
      ),
    });

    setCelebrating(true);

    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 65,
          spread: 75,
          origin: { y: 0.6 },
        });
      }
    } catch {
      // Ignored in test environment
    }

    setTimeout(() => {
      if (onSuccess) onSuccess(newRecord);
      if (onClose) onClose();
    }, 850);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Presensi ${type === 'MASUK' ? 'Masuk' : 'Pulang'}`}
      data-testid={testId}
    >
      <div className="space-y-4">
        {/* Status Indicators */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Radius Kantor: </span>
            <span
              data-testid="geofence-status"
              className={withinGeofence ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}
            >
              {withinGeofence ? 'Dalam Radius Kantor' : 'Luar Radius'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Ketepatan: </span>
            <span
              data-testid="punctuality-status"
              className={punctuality === 'Tepat Waktu' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}
            >
              {punctuality}
            </span>
          </div>
        </div>

        {/* Viewfinder or Watermark Preview */}
        {!previewPhoto ? (
          <CameraWidget onCapture={handleCapture} />
        ) : (
          <div className="space-y-3">
            <div
              data-testid="watermark-preview-screen"
              className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-[4/3] shadow-md"
            >
              <img
                src={previewPhoto}
                alt="Watermark Preview"
                className="w-full h-full object-cover"
              />
              {celebrating && (
                <div
                  data-testid="celebration-animation"
                  className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-20"
                >
                  <div className="w-20 h-20 max-w-full max-h-full overflow-hidden shrink-0 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                    <svg width="48" height="48" className="w-12 h-12 max-w-full max-h-full shrink-0 text-emerald-400" viewBox="0 0 52 52">
                      <path
                        ref={checkmarkPathRef}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 27l8 8 16-16"
                      />
                    </svg>
                  </div>
                  <span className="text-base font-bold tracking-wide text-emerald-300">Presensi Berhasil!</span>
                  <span className="text-xs text-slate-300 mt-1">Data kehadiran telah tersimpan</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              >
                Foto Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={processing || celebrating}
                data-testid="btn-submit-attendance"
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:brightness-105 shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
              >
                Kirim Presensi
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default AttendanceModal;
