import React, { useEffect, useRef } from 'react';

/**
 * Accessible Modal Component
 * Features:
 * - Backdrop blur overlay
 * - Keyboard ESC dismissal
 * - Click outside to dismiss
 * - Accessible ARIA dialog attributes
 * - Smooth fade and scale transitions
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  'data-testid': testId = 'app-modal',
  className = '',
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-dialog-title' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 animate-fade-in"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className={`relative z-10 w-full max-w-lg p-6 sm:p-7 rounded-3xl shadow-2xl border border-slate-200/90 bg-white text-slate-800 transform transition-all duration-200 scale-100 ${className}`}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          {title && (
            <h3
              id="modal-dialog-title"
              className="text-lg font-extrabold text-slate-900 tracking-tight"
            >
              {title}
            </h3>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
