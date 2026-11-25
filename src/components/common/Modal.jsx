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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300 animate-fade-in"
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
        className={`relative z-10 w-full max-w-lg glass-panel p-6 rounded-2xl shadow-spatial-depth border border-slate-700/60 bg-slate-900/95 text-slate-100 transform transition-all duration-200 scale-100 ${className}`}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/50">
          {title && (
            <h3
              id="modal-dialog-title"
              className="text-lg font-bold text-white tracking-wide"
            >
              {title}
            </h3>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
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
