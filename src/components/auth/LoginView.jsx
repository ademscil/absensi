import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTenant } from '../../context/TenantContext.jsx';
import { SpatialCard } from '../common/SpatialCard.jsx';
import { SpatialBackground } from '../common/SpatialBackground.jsx';
import { DemoCredentials } from './DemoCredentials.jsx';
import {
  animateLoginSequence,
  cancelAnimation,
  pulseButton,
} from '../../utils/animations.js';

/**
 * LoginView - High-fidelity animated login screen
 * Features:
 * - SpatialCard with interactive pointer-following 3D perspective tilt
 * - SpatialBackground ambient particle canvas
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
      className={`login-view min-h-[100dvh] w-full flex items-center justify-center p-4 relative overflow-x-hidden ${className}`}
    >
      <SpatialBackground data-testid="spatial-background" />

      <div className="w-full max-w-md mx-auto my-auto relative z-10">
        <SpatialCard
          data-testid="login-card"
          role="region"
          aria-label="Formulir Masuk Sistem"
          className="p-6 sm:p-8 rounded-3xl border border-slate-700/60 bg-slate-900/85 backdrop-blur-xl shadow-spatial-depth"
        >
          {/* Header & Brand Logo */}
          <div ref={headerRef} className="text-center mb-6">
            <div
              ref={brandCrestRef}
              data-testid="brand-logo"
              className="w-14 h-14 sm:w-16 sm:h-16 max-w-full max-h-full object-contain overflow-hidden mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-glow transition-transform duration-300 hover:scale-105 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
              dangerouslySetInnerHTML={{ __html: currentTenant.logoSvg }}
            />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {currentTenant.name}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {currentTenant.tagline}
            </p>
          </div>

          {/* Role Toggle Selector */}
          <div className="mb-5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center gap-1">
            <button
              type="button"
              data-testid="role-toggle-karyawan"
              onClick={() => handleRoleToggle('karyawan')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'karyawan'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {labels.userLabel}
            </button>
            <button
              type="button"
              data-testid="role-toggle-admin"
              onClick={() => handleRoleToggle('admin')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin HR
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center animate-fade-in"
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
                  className="block text-xs font-semibold text-slate-300 mb-1"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="form-input-group">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-300 mb-1"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              ref={submitBtnRef}
              type="submit"
              disabled={loading}
              data-testid="btn-login-submit"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-primary hover:brightness-110 active:scale-[0.98] transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Quick-Fill Demo Pills */}
          <div ref={pillsRef} className="mt-6 pt-5 border-t border-slate-800/80">
            <DemoCredentials
              onSelectAccount={handleSelectDemo}
              onInstantLogin={handleInstantLogin}
              filterRole="all"
            />
          </div>
        </SpatialCard>
      </div>
    </div>
  );
}

export default LoginView;
