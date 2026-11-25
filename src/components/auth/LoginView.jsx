import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Eye, EyeOff, Orbit } from 'lucide-react';
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
 * LoginView - High-Fidelity Split Screen Login modeled directly after Astra SATSET (10.14.181.239:3000) & EMONDAY
 * Features:
 * - Left Side: Astra deep corporate blue diagonal showcase with interactive 3D Saturn planet, rings, and floating neon wireframe polyhedra
 * - Right Side: Clean, pure, luminous white background with circular badge logo, "Welcome / Sign in to...", soft rounded inputs with icons, and bold primary action button
 * - "MOVE YOUR CURSOR — THE PLANET FOLLOWS" interactive feedback
 * - "AKURASI DATA • VERIFIKASI REAL-TIME • TRANSPARANSI KERJA" bottom branding
 * - Evaluator demo quick-fill pills & instant login
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
  const [showPassword, setShowPassword] = useState(false);
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
      className={`login-view min-h-[100dvh] w-full flex flex-col lg:flex-row relative bg-white text-slate-800 overflow-x-hidden ${className}`}
    >
      {/* LEFT COLUMN: SATSET Branded Showcase with Angled Diagonal Split (Desktop 54%) */}
      <div className="lg:w-[54%] hidden lg:flex flex-col justify-between p-10 lg:p-14 bg-gradient-to-br from-[#07162c] via-[#0b2447] to-[#12386e] text-white relative overflow-hidden [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)] z-10">
        {/* Subtle geometric dot grid pattern (Astra EMONDAY / SATSET pattern) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 z-0" />

        {/* Interactive 3D Space Canvas Background with Planet & Wireframe Polyhedra */}
        <SpatialBackground
          data-testid="spatial-background"
          showPlanet={true}
          planetXRatio={0.52}
          planetYRatio={0.48}
          particleCount={55}
          className="absolute inset-0 z-0"
        />

        {/* Ambient Cosmic Radial Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-12 right-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none z-0" />

        {/* Top Brand Tag with Celestial Orbit Icon */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-200 shadow-sm relative z-10 w-fit">
          <Orbit className="w-4 h-4 text-cyan-400" />
          <span>{currentTenant.name} &bull; Enterprise Attendance</span>
        </div>

        {/* Center Headline & Showcase */}
        <div className="my-auto py-8 relative z-10 max-w-lg space-y-6">
          <div className="space-y-3">
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Smart Attendance Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
              Sistem Presensi <br />
              <span className="text-cyan-400 tracking-wide">{currentTenant.name}</span>
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed max-w-md">
              Solusi presensi mandiri dengan verifikasi kamera selfie, stempel anti-fraud WIB & GPS, serta rekapitulasi data ketenagakerjaan yang akurat dan transparan.
            </p>
          </div>

          {/* Bento Feature Cards */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm max-w-md">
              <div className="w-9 h-9 rounded-xl bg-blue-500/30 text-blue-200 flex items-center justify-center text-base shrink-0 border border-blue-400/30">
                📷
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Selfie Watermark Anti-Fraud</div>
                <div className="text-blue-100 text-[11px]">Stempel waktu WIB, NIK, dan koordinat GPS dicap ke foto.</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm max-w-md">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/30 text-emerald-200 flex items-center justify-center text-base shrink-0 border border-emerald-400/30">
                ⚡
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Approval Izin & Cuti Real-Time</div>
                <div className="text-emerald-100 text-[11px]">Notifikasi instan dan pemotongan sisa kuota otomatis oleh HR.</div>
              </div>
            </div>
          </div>

          {/* Interactive Cursor Indicator (from 3D reference) */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-mono tracking-widest text-cyan-200 uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              MOVE YOUR CURSOR — THE PLANET FOLLOWS
            </div>
          </div>
        </div>

        {/* Enterprise Attendance Operational Pillars & Tagline */}
        <div className="pt-6 border-t border-white/15 space-y-2 relative z-10">
          <div className="flex items-center gap-3 text-slate-300 font-bold tracking-wider uppercase text-[10px] sm:text-[11px]">
            <span>AKURASI DATA</span>
            <span>&bull;</span>
            <span>VERIFIKASI REAL-TIME</span>
            <span>&bull;</span>
            <span>TRANSPARANSI KERJA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-[11px] tracking-widest uppercase truncate max-w-md">
              {currentTenant.tagline || 'Sistem Presensi & Manajemen Ketenagakerjaan'}
            </span>
            <span className="h-0.5 w-10 bg-cyan-400 rounded-full shrink-0" />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean Pure White SATSET Login Form (Desktop 46%, Mobile 100%) */}
      <div className="w-full lg:w-[46%] min-h-screen flex items-center justify-center p-6 sm:p-12 lg:p-14 bg-white relative z-10">
        <div
          data-testid="login-card"
          role="region"
          aria-label="Formulir Masuk Sistem"
          className="w-full max-w-md mx-auto"
        >
          {/* Header & Circular Branded Logo (SATSET Circular Crest Pattern) */}
          <div ref={headerRef} className="text-center mb-6">
            <div className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
              {/* Glowing Ambient Halo */}
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md pointer-events-none" />
              <div
                ref={brandCrestRef}
                data-testid="brand-logo"
                className="w-14 h-14 sm:w-16 sm:h-16 max-w-full max-h-full object-contain overflow-hidden rounded-full p-2 bg-slate-900 border-2 border-primary/50 flex items-center justify-center shadow-lg relative z-10 transition-transform duration-300 hover:scale-105 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
                dangerouslySetInnerHTML={{ __html: currentTenant.logoSvg }}
              />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Masuk ke Sistem
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Portal Layanan Presensi & HR {currentTenant.name}
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
              {/* NIK / Email Input */}
              <div className="form-input-group">
                <label
                  htmlFor="login-nik"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Username / {labels.idLabel}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-nik"
                    name="nikOrEmail"
                    type="text"
                    required
                    value={nikOrEmail}
                    onChange={(e) => setNikOrEmail(e.target.value)}
                    placeholder={`Enter Your ${labels.idLabel} (e.g. ${
                      selectedRole === 'admin' ? 'ADM-001' : 'EMP-001'
                    })...`}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-input-group">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Password / Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Your Password..."
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* SATSET Options: Remember me & Forgot password */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="text-xs text-primary font-bold hover:underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Solid Primary Login Button */}
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={loading}
              data-testid="btn-login-submit"
              className="w-full min-h-[44px] py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-primary hover:bg-blue-700 active:scale-[0.99] transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Quick-Fill Evaluator Demo Pills */}
          <div ref={pillsRef} className="mt-6 pt-5 border-t border-slate-100">
            <DemoCredentials
              onSelectAccount={handleSelectDemo}
              onInstantLogin={handleInstantLogin}
              filterRole="all"
            />
          </div>

          {/* Footer Clearance Link */}
          <div className="text-center mt-5 text-[11px] text-slate-400">
            &copy; 2026 {currentTenant.name}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
