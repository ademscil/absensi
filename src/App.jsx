import React, { useState, useEffect } from 'react';
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
import { SpatialCard } from './components/common/SpatialCard.jsx';
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
    <div className="app-shell min-h-[100dvh] flex flex-col bg-slate-950/35 text-slate-100 relative z-0">
      <SpatialBackground data-testid="spatial-background" />

      {/* Persistent Shell Header */}
      <Header />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-6 relative z-10">
        {/* Desktop Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Role-Based View Container */}
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 overflow-y-auto">
          {role === 'karyawan' ? (
            <>
              {activeTab === 'presensi' && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {/* Action Banner Card */}
                  <SpatialCard className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-3xl">
                      📷
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Presensi Kehadiran Harian</h2>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Lakukan selfie wajah ber-watermark untuk verifikasi kehadiran resmi
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                      <button
                        type="button"
                        data-testid="btn-open-masuk"
                        onClick={() => handleOpenAttendance('MASUK')}
                        className="py-3 px-6 rounded-2xl font-bold text-xs text-white bg-primary hover:brightness-110 shadow-glow transition-all cursor-pointer"
                      >
                        Presensi Masuk (07:00 - 08:00)
                      </button>
                      <button
                        type="button"
                        data-testid="btn-open-pulang"
                        onClick={() => handleOpenAttendance('PULANG')}
                        className="py-3 px-6 rounded-2xl font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                      >
                        Presensi Pulang (17:00)
                      </button>
                    </div>
                  </SpatialCard>

                  {/* Summary History */}
                  <AttendanceHistory key={refreshKey} />
                </div>
              )}

              {activeTab === 'riwayat' && (
                <div className="max-w-2xl mx-auto">
                  <AttendanceHistory key={refreshKey} />
                </div>
              )}

              {activeTab === 'pengajuan' && (
                <div className="max-w-2xl mx-auto space-y-6">
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
