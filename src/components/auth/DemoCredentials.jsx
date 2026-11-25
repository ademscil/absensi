import React from 'react';

/**
 * Evaluator demo accounts list
 * Guaranteed to match registered seed users and authentication rules.
 */
const EVALUATOR_ACCOUNTS = [
  {
    nik: 'EMP-001',
    name: 'Ahmad Fauzi',
    role: 'karyawan',
    roleLabel: 'Karyawan',
    position: 'Senior Engineer',
    password: 'password123',
  },
  {
    nik: 'EMP-003',
    name: 'Budi Santoso',
    role: 'karyawan',
    roleLabel: 'Karyawan',
    position: 'Operations Supervisor',
    password: 'password123',
  },
  {
    nik: 'ADM-001',
    name: 'Siti Rahma, S.Psi',
    role: 'admin',
    roleLabel: 'Admin HR',
    position: 'HR Manager',
    password: 'password123',
  },
];

/**
 * DemoCredentials - Quick-fill and instant one-click login pills for evaluators
 */
export function DemoCredentials({
  onSelectAccount,
  onInstantLogin,
  filterRole = 'all',
  'data-testid': testId = 'demo-credentials',
  className = '',
}) {
  const accountsToDisplay = EVALUATOR_ACCOUNTS.filter((acc) => {
    if (filterRole === 'all') return true;
    return acc.role === filterRole;
  });

  const handlePillClick = (acc, e) => {
    e.preventDefault();
    if (onSelectAccount) {
      onSelectAccount(acc);
    }
  };

  const handleInstantLogin = (acc, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onInstantLogin) {
      onInstantLogin(acc);
    } else if (onSelectAccount) {
      onSelectAccount(acc);
    }
  };

  return (
    <div data-testid={testId} className={`demo-credentials space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
        <span>Akun Demo Cepat</span>
        <span className="text-[10px] text-sky-400 font-normal">Klik untuk isi instan</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {accountsToDisplay.map((acc) => (
          <div
            key={acc.nik}
            className="group relative inline-flex items-center rounded-full bg-slate-800/90 border border-slate-700/80 hover:border-sky-500/60 transition-all shadow-sm overflow-hidden"
          >
            <button
              type="button"
              data-testid={`demo-pill-${acc.role}`}
              data-account-nik={acc.nik}
              onClick={(e) => handlePillClick(acc, e)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors focus:outline-none"
              title={`Isi kredensial ${acc.name} (${acc.nik})`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  acc.role === 'admin' ? 'bg-purple-400' : 'bg-sky-400'
                }`}
              />
              <span>
                {acc.role === 'admin' ? 'Admin HR' : 'Karyawan'} ({acc.name.split(' ')[0]})
              </span>
            </button>

            {onInstantLogin && (
              <button
                type="button"
                data-testid={`demo-instant-${acc.nik.toLowerCase()}`}
                onClick={(e) => handleInstantLogin(acc, e)}
                className="px-2 py-1.5 bg-slate-700/60 hover:bg-sky-600 text-[10px] font-bold text-slate-300 hover:text-white border-l border-slate-700/80 transition-colors"
                title="Langsung Masuk"
              >
                ⚡
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DemoCredentials;
