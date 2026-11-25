import React from 'react';

/**
 * Badge - Reusable status and categorization badge
 * Supports variants: success, warning, danger, neutral, primary (plus default, info, purple)
 * with smooth transitions and automatic status text detection.
 */
export function Badge({
  children,
  variant = 'default',
  className = '',
  'data-testid': testId = 'status-badge',
  ...props
}) {
  const variantStyles = {
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    default: 'bg-slate-800/80 text-slate-200 border-slate-700',
    primary: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all duration-200 ease-out ${
        variantStyles[resolvedVariant] || variantStyles.default
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
