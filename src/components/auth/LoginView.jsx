import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTenant } from '../../context/TenantContext.jsx';
import { SpatialBackground } from '../common/SpatialBackground.jsx';
import { DemoCredentials } from './DemoCredentials.jsx';
import {
  animateLoginSequence,
  cancelAnimation,
  pulseButton,
} from '../../utils/animations.js';

/**
 * LoginView - High-fidelity Split-Screen Animated Login Experience
 * Features:
 * - Enterprise Split-Screen layout (Hero showcase on left, clean white form card on right)
 * - Eliminates awkward centered box floating on empty background
 * - Full responsive mobile stacking (seamless native app feel on small screens)
 * - Anime.js choreographed entry sequence
 * - Tenant branding (logo, colors, domain-specific labels)
 * - Role toggle selector (Karyawan vs Admin HR)
 * - Evaluator demo credential quick-fill and instant login
 * - Real error states and accessible form inputs
 */
export function LoginView({
  'data-testid': testId = 'login-view',
  className = '',
}) {
  const { login } = useAuth();
  const { currentTenant, labels } = useTenant();

  const [selectedRole, setSelectedRole] = useState('karyawan'); // 'karyawan' | 'admin'
  const [nikOrEmail, setNikOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const brandCrestRef = useRef(null);
  const formCardRef = useRef(null);
  const inputsRef = useRef(null);
  const submitBtnRef = useRef(null);
  const pillsRef = useRef(null);
  const animTimelineRef = useRef(null);

  // Trigger Anime.js choreographed entrance sequence
  useEffect(() => {
    try {
      animTimelineRef.current = animateLoginSequence(containerRef.current, {
        brandCrest: brandCrestRef.current,
        header: headerRef.current,
        formCard: formCardRef.current,
        inputs: inputsRef.current?.querySelectorAll('.form-input-group'),
        pills: pillsRef.current,
        submitBtn: submitBtnRef.current,
      });
    } catch {
      // Fallback: visual elements remain visible via CSS
    }

    return () => {
      cancelAnimation(animTimelineRef.current);
    };
  }, []);

  const handleRoleToggle = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    // If switching role, clear or set demo account for convenience
    if (role === 'admin' && nikOrEmail.startsWith('EMP-')) {
      setNikOrEmail('');
      setPassword('');
    } else if (role === 'karyawan' && nikOrEmail.startsWith('ADM-')) {
      setNikOrEmail('');
      setPassword('');
    }
  };

  const handleSelectDemo = (demoAccount) => {
    setSelectedRole(demoAccount.role);
    setNikOrEmail(demoAccount.nik);
    setPassword(demoAccount.password);
    setErrorMessage('');
  };

  const handleInstantLogin = (demoAccount) => {
    setSelectedRole(demoAccount.role);
    setNikOrEmail(demoAccount.nik);
    setPassword(demoAccount.password);
    setErrorMessage('');
    setLoading(true);

    const res = login({
      nikOrEmail: demoAccount.nik,
      password: demoAccount.password,
    });
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Login gagal.');
    }
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    if (submitBtnRef.current) {
      pulseButton(submitBtnRef.current);
    }

    const res = login({ nikOrEmail, password });
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Login gagal. Periksa kembali NIK dan kata sandi.');
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className={`login-view min-h-[100dvh] w-full flex flex-col lg:flex-row relative bg-slate-50 text-slate-800 ${className}`}
    >
      {/* LEFT SIDE: Hero Showcase (Desktop 50%) */}
      <div className="lg:w-1/2 hidden lg:flex flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white relative overflow-hidden z-10">
        {/* Ambient Spatial Particle Layer */}
        <SpatialBackground data-testid="spatial-background" className="opacity-40" />

        {/* Ambient Top Light Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Tag */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20 shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: currentTenant.logoSvg }}
          />
          <div>
            <div className="text-sm font-bold tracking-wide">{currentTenant.name}</div>
            <div className="text-xs text-blue-300 font-medium">{currentTenant.category}</div>
          </div>
        </div>

        {/* Hero Headline & Key Value Propositions */}
        <div className="space-y-8 my-auto py-10 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Absensi Digital Terintegrasi
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Kelola Kehadiran Kerja Lebih Cepat, Akurat & Transparan.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Dilengkapi kamera selfie dengan canvas watermark anti-manipulasi waktu WIB, alur persetujuan izin instan oleh HR, serta rekapitulasi data otomatis yang siap diekspor ke Excel.
          </p>

          {/* Feature Highlights Bento Cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-lg shrink-0">
                📷
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Selfie Watermark Otomatis</div>
                <div className="text-slate-300 text-[11px] mt-0.5">Mencap waktu, tanggal, NIK, dan kode verifikasi ke canvas foto.</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-lg shrink-0">
                ⚡
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Approval Izin & Cuti Real-Time</div>
                <div className="text-slate-300 text-[11px] mt-0.5">Persetujuan cuti/sakit langsung tersinkronisasi tanpa reload halaman.</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg shrink-0">
                📊
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Rekapitulasi & Ekspor Excel (.xlsx)</div>
                <div className="text-slate-300 text-[11px] mt-0.5">Filter multi-kriteria tanggal & departemen, download spreadsheet 1-klik.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4 relative z-10">
          <span>&copy; 2026 {currentTenant.name}</span>
          <span className="text-blue-300 font-medium">Enterprise Ready</span>
        </div>
      </div>

      {/* RIGHT SIDE: Clean & Spacious Login Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-10 lg:p-12 relative z-10">
        <div
          data-testid="login-card"
          role="region"
          aria-label="Formulir Masuk Sistem"
          className="w-full max-w-md mx-auto p-7 sm:p-9 rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50"
        >
          {/* Header & Brand Logo */}
          <div ref={headerRef} className="text-center mb-6">
            <div
              ref={brandCrestRef}
              data-testid="brand-logo"
              className="w-14 h-14 sm:w-16 sm:h-16 max-w-full max-h-full object-contain overflow-hidden mx-auto mb-3.5 rounded-2xl p-2 bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm transition-transform duration-300 hover:scale-105 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
              dangerouslySetInnerHTML={{ __html: currentTenant.logoSvg }}
            />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentTenant.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {currentTenant.tagline}
            </p>
          </div>

          {/* Role Toggle Selector */}
          <div className="mb-5 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center gap-1">
            <button
              type="button"
              data-testid="role-toggle-karyawan"
              onClick={() => handleRoleToggle('karyawan')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedRole === 'karyawan'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {labels.userLabel}
            </button>
            <button
              type="button"
              data-testid="role-toggle-admin"
              onClick={() => handleRoleToggle('admin')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin HR
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center animate-fade-in"
            >
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form ref={formCardRef} onSubmit={handleSubmit} className="space-y-4">
            <div ref={inputsRef} className="space-y-3.5">
              <div className="form-input-group">
                <label
                  htmlFor="login-nik"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  {labels.idLabel} atau Email
                </label>
                <input
                  id="login-nik"
                  name="nikOrEmail"
                  type="text"
                  required
                  value={nikOrEmail}
                  onChange={(e) => setNikOrEmail(e.target.value)}
                  placeholder={`Masukkan ${labels.idLabel} (cth: ${
                    selectedRole === 'admin' ? 'ADM-001' : 'EMP-001'
                  })...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                />
              </div>

              <div className="form-input-group">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Kata Sandi
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              ref={submitBtnRef}
              type="submit"
              disabled={loading}
              data-testid="btn-login-submit"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-primary hover:brightness-105 active:scale-[0.98] transition-all shadow-md shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Quick-Fill Demo Pills */}
          <div ref={pillsRef} className="mt-6 pt-5 border-t border-slate-100">
            <DemoCredentials
              onSelectAccount={handleSelectDemo}
              onInstantLogin={handleInstantLogin}
              filterRole="all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
