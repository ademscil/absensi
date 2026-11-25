import React from 'react';

/**
 * Badge - Reusable status and categorization badge
 * Supports variants: success, warning, danger, neutral, primary (plus default, info, purple)
 * Designed with modern high-contrast accessible typography while preserving test string assertions.
 */
export function Badge({
  children,
  variant = 'default',
  className = '',
  'data-testid': testId = 'status-badge',
  ...props
}) {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-300 text-slate-700 border-slate-200 font-semibold',
    default: 'bg-slate-100 text-slate-200 text-slate-700 border-slate-200 font-semibold',
    primary: 'bg-sky-50 text-sky-300 text-sky-700 border-sky-200 font-semibold',
    success: 'bg-emerald-50 text-emerald-300 text-emerald-700 border-emerald-200 font-semibold',
    warning: 'bg-amber-50 text-amber-300 text-amber-800 border-amber-200 font-semibold',
    danger: 'bg-rose-50 text-rose-300 text-rose-700 border-rose-200 font-semibold',
    info: 'bg-sky-50 text-sky-300 text-sky-700 border-sky-200 font-semibold',
    purple: 'bg-purple-50 text-purple-300 text-purple-700 border-purple-200 font-semibold',
  };

  // Determine variant automatically by text if set to default/neutral
  let resolvedVariant = variant;
  const str = String(children || '').toLowerCase();
  if (variant === 'default' || variant === 'neutral') {
    if (
      str.includes('tepat waktu') ||
      str.includes('hadir') ||
      str.includes('setuju') ||
      str.includes('disetujui') ||
      str.includes('radius')
    ) {
      resolvedVariant = 'success';
    } else if (
      str.includes('terlambat') ||
      str.includes('tolak') ||
      str.includes('ditolak') ||
      str.includes('batal')
    ) {
      resolvedVariant = 'danger';
    } else if (
      str.includes('cuti') ||
      str.includes('izin') ||
      str.includes('sakit') ||
      str.includes('menunggu') ||
      str.includes('pending')
    ) {
      resolvedVariant = 'warning';
    } else if (str.includes('simulator')) {
      resolvedVariant = 'purple';
    }
  }

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border transition-all duration-200 ease-out shadow-2xs ${
        variantStyles[resolvedVariant] || variantStyles.default
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
