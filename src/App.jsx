import React, { useState, useEffect } from 'react';
import { Camera, Clock, ShieldCheck, MapPin, Zap } from 'lucide-react';
import { TenantProvider } from './context/TenantContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { initStorage } from './utils/storage.js';
import { Header } from './components/layout/Header.jsx';
import { BottomNav } from './components/layout/BottomNav.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { LoginView } from './components/auth/LoginView.jsx';
import { AttendanceModal } from './components/attendance/AttendanceModal.jsx';
import { AttendanceHistory } from './components/attendance/AttendanceHistory.jsx';
import { LeaveRequestForm } from './components/leave/LeaveRequestForm.jsx';
import { LeaveStatusList } from './components/leave/LeaveStatusList.jsx';
import { AdminDashboard } from './components/admin/AdminDashboard.jsx';
import { LeaveApprovalHub } from './components/admin/LeaveApprovalHub.jsx';
import { AttendanceRekap } from './components/admin/AttendanceRekap.jsx';
import { SpatialBackground } from './components/common/SpatialBackground.jsx';
import './styles/designTokens.css';
import './styles/index.css';

/**
 * Main application shell coordinating contexts, layout, and view routing.
 */
function MainAppShell() {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTab] = useState(() => (role === 'admin' ? 'dashboard' : 'presensi'));
  const [prevRole, setPrevRole] = useState(role);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState('MASUK');
  const [refreshKey, setRefreshKey] = useState(0);

  // Synchronize default tab during render when role switches
  if (role !== prevRole) {
    setPrevRole(role);
    setActiveTab(role === 'admin' ? 'dashboard' : 'presensi');
  }

  // Initialize storage seeds once on mount
  useEffect(() => {
    initStorage(false);
  }, []);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenAttendance = (type) => {
    setAttendanceType(type);
    setIsAttendanceModalOpen(true);
  };

  const handleAttendanceSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="app-shell min-h-[100dvh] flex flex-col bg-slate-50 text-slate-800 relative z-0">
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <SpatialBackground data-testid="spatial-background" />
      </div>

      {/* Persistent Shell Header */}
      <Header />

      {/* Main Body Layout */}
      <div className="flex-1 flex w-full relative z-10">
        {/* Desktop Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Role-Based View Container */}
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto pb-20 md:pb-6 space-y-6">
            {role === 'karyawan' ? (
              <>
                {activeTab === 'presensi' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    {/* Action Banner Card */}
                    <div
                      data-testid="spatial-card"
                      className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden"
                    >
                      {/* Decorative ambient gradient backdrop */}
                      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

                      {/* Top Header Row with Status Pill & Greeting */}
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Portal Presensi Karyawan
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                            Presensi Kehadiran Harian
                          </h2>
                          <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                            Lakukan selfie wajah ber-watermark untuk verifikasi kehadiran resmi dengan stempel waktu WIB & GPS.
                          </p>
                        </div>
                        <div className="shrink-0">
                          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Shift Reguler (08:00 - 17:00 WIB)</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Masuk & Pulang */}
                      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <button
                          type="button"
                          data-testid="btn-open-masuk"
                          onClick={() => handleOpenAttendance('MASUK')}
                          className="group relative p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center gap-3.5 text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-blue-100">Pagi Hari</div>
                            <div className="text-sm font-extrabold text-white">Presensi Masuk</div>
                            <div className="text-[11px] text-blue-200/90 mt-0.5">Jadwal: 07:00 - 08:00 WIB</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          data-testid="btn-open-pulang"
                          onClick={() => handleOpenAttendance('PULANG')}
                          className="group relative p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center gap-3.5 text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Clock className="w-6 h-6 text-slate-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-500">Sore Hari</div>
                            <div className="text-sm font-extrabold text-slate-900">Presensi Pulang</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Mulai Pukul 17:00 WIB</div>
                          </div>
                        </button>
                      </div>

                      {/* Operational Value Pillars Strip */}
                      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">Watermark Anti-Fraud</div>
                            <div className="text-slate-500 text-[11px]">Waktu & NIK dicap ke foto</div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">Radius Kantor Valid</div>
                            <div className="text-slate-500 text-[11px]">Geofence lokasi terverifikasi</div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                          <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">Sinkronisasi Real-Time</div>
                            <div className="text-slate-500 text-[11px]">Terhubung ke Admin HR</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary History */}
                    <AttendanceHistory key={refreshKey} />
                  </div>
                )}

                {activeTab === 'riwayat' && (
                  <div className="max-w-3xl mx-auto">
                    <AttendanceHistory key={refreshKey} />
                  </div>
                )}

                {activeTab === 'pengajuan' && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <LeaveRequestForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
                    <LeaveStatusList refreshKey={refreshKey} />
                  </div>
                )}
              </>
            ) : (
              <>
                {activeTab === 'dashboard' && <AdminDashboard key={refreshKey} />}
                {activeTab === 'approval' && (
                  <LeaveApprovalHub
                    key={refreshKey}
                    onProcessed={() => setRefreshKey((k) => k + 1)}
                  />
                )}
                {activeTab === 'rekap' && <AttendanceRekap key={refreshKey} />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Attendance Camera & Watermark Modal */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        type={attendanceType}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSuccess={handleAttendanceSuccess}
      />
    </div>
  );
}

export function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <MainAppShell />
      </AuthProvider>
    </TenantProvider>
  );
}

export default App;
